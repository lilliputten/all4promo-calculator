<?php
/**
 * @descr Update changed prices
 * @changed 2025.04.25, 00:20
 */

// Write logs to a local file
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// Display errors (with different options):
// ini_set('display_errors', 'On');
// error_reporting(E_ALL);
// error_reporting(-1);
// set_error_handler('var_dump'); // Dump variables into output

include('app-utils.php');

// Import config...
include('app-config.php');
// Import optional custom config...
if (file_exists('app-config-override.php')) {
  include('app-config-override.php');
}

define('NL', "\n");

$prjPath = unix_path(realpath(dirname(__FILE__)));

// print('file: $prjPath: ' . $prjPath . NL);
// print('test: dataFileName: ' . print_r($dataFileName, true) . NL);

$clientIp = getClientIpAddress();

$pageUrl = !empty(@$_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$pageId = getPageIdFromUrl($pageUrl);

$specialFields = array(
  '_ip' => $clientIp,
  '_date' => date('Y.m.d G:i'),
  '_pageUrl' => $pageUrl,
  '_pageId' => $pageId,
);

$isTest = empty($clientIp);
$isDebug = true; // !empty(@$postData['debug']); // TODO: Get debug key from headers

function getPostData()
{
  global $_POST;
  $rawInput = file_get_contents('php://input');
  $rawInputFirstChar = substr(@$rawInput, 0, 1);
  // Does it start with json's '{' or '[' (php-5 way)?
  $isJson = $rawInputFirstChar === '[' || $rawInputFirstChar === '{';
  $postData = $isJson ? objectToArray(json_decode($rawInput)) : $_POST;
  return $postData;
}

function loadJsonFile(string $filePath)
{
  try {
    $jsonStr = file_get_contents($filePath);
    if (empty($jsonStr)) {
      throw new ErrorException('Error file loading');
    }
    $data = json_decode($jsonStr, true, 512, JSON_THROW_ON_ERROR);
    if (empty($data)) {
      throw new ErrorException('Parsing error');
    }
    return $data;
  } catch (Exception $err) {
    $errText = $err->getMessage();
    // echo 'Caught exception: ',  $errText, NL;
    sendError('Can not read the data file: ' . $errText);
    die;
  }
}

function saveJsonFile(string $filePath, array $data)
{
  try {
    $jsonStr = json_encode($data, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    file_put_contents($filePath, $jsonStr, LOCK_EX);
  } catch (Exception $err) {
    $errText = $err->getMessage();
    // echo 'Caught exception: ',  $errText, NL;
    sendError('Can not write the data file: ' . $errText);
    die;
  }
}

function loadData()
{
  global $prjPath, $dataFileName;
  $filePath = path_join($prjPath, $dataFileName);
  return loadJsonFile($filePath);
}

function saveData(array $data)
{
  global $prjPath, $dataFileName;
  $filePath = path_join($prjPath, $dataFileName);
  saveJsonFile($filePath, $data);
}

function checkEnvironment()
{
  global $isDebug, $clientIp, $pageUrl, $checkUrlPrefix;
  if (empty($clientIp)) {
    sendError('Invalid environment (1)');
    die;
  }
  if (empty($pageUrl)) {
    sendError('Invalid environment (2)');
    die;
  }
  if (!$isDebug && substr($pageUrl, 0, strlen($checkUrlPrefix)) !== $checkUrlPrefix) {
    sendError('Invalid environment (3)');
    die;
  }
}

function checkFormData()
{
  global $postData, $requiredFields;
  if (empty($postData)) {
    sendError('No client data');
    die;
  }
  if (!empty($requiredFields)) {
    foreach ($requiredFields as $id) {
      if (empty(@$postData[$id])) {
        sendError('No client data field: ' . $id);
        die;
      }
    }
  }
}

function getPageIdFromUrl($pageUrl)
{
  $id = $pageUrl;
  $id = preg_replace('/\.html$/', '', $id);
  $id = preg_replace('/^http.*:\/\/[^\/]*\//', '', $id);
  $id = preg_replace('/\/$/', '', $id);
  $id = preg_replace('/^\?/', 'root-', $id); // ???
  $id = preg_replace('/\W+/', '-', $id);
  return $id;
}

function objectToArray($d)
{
  if (is_object($d)) {
    // Gets the properties of the given object
    // with get_object_vars function
    $d = get_object_vars($d);
  }
  if (is_array($d)) {
    /*
     * Return array converted to object
     * Using __FUNCTION__ (Magic constant)
     * for recursive call
     */
    return array_map(__FUNCTION__, $d);
  } else {
    // Return array
    return $d;
  }
}

function getClientIpAddress()
{
  global $_SERVER;
  if (!empty(@$_SERVER['HTTP_CLIENT_IP'])) {
    return $_SERVER['HTTP_CLIENT_IP'];
  } elseif (!empty(@$_SERVER['HTTP_X_FORWARDED_FOR'])) {
    return $_SERVER['HTTP_X_FORWARDED_FOR'];
  } elseif (!empty(@$_SERVER['REMOTE_ADDR'])) {
    return $_SERVER['REMOTE_ADDR'];
  }
  return '';
}

function sendError($errText, $debugData = NULL)
{
  $responseData = array();
  $responseData['error'] = $errText;
  if (!empty($debugData)) {
    $responseData['errorInfo'] = $debugData;
  }
  error_log('Error: ' . $errText);
  // http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  print(json_encode($responseData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . NL);
}

function processUpdates($postData)
{
  global $isTest, $isDebug, $specialFields;

  error_log('processUpdates: ' . print_r($postData, true));

  $data = loadData();

  try {
    $dataTypes = &$data['types'];
    $changedPrices = &$postData['changedPrices'];
    if (!is_array($changedPrices)) {
      throw new ErrorException('Expected list variable `changedPrices`');
    }
    if ($isTest) {
      echo 'changedPrices: ' . print_r($changedPrices, true) . NL;
      echo 'postData: ' . print_r($postData, true) . NL;
      echo 'data: ' . print_r($data, true) . NL;
    }
    for($i = 0; $i < count($changedPrices); $i++) {
      $idx = $changedPrices[$i]['idx'];
      $pricesData = $changedPrices[$i]['prices'];
      if (!is_array($dataTypes[$idx])) {
        throw new ErrorException('Not found data type object at index ' . $idx);
      }
      $dataTypes[$idx]['prices'] = $pricesData;
    }
  } catch (Exception $err) {
    $errText = $err->getMessage();
    sendError('Error updating data: ' . $errText);
    die;
  }
  saveData($data);

  $responseData = array(
    // 'ok' => true, // True -- if the operation was successful
    // 'error' => NULL, // A brief text explaining the error (if any; it will be shown to the user). If successful, do not send anything (either NULL or an empty string).
    // 'errorInfo' => $postData, // DEBUG: Only for debug purposes
  );

  $responseData['updatedData'] = $data;
  if ($isDebug && !empty($postData)) {
    $responseData['_postData'] = $postData;
  }
  if ($isDebug && !empty($specialFields)) {
    $responseData['_specialFields'] = $specialFields;
  }

  // TODO: Read yaml data file (from `$dataFileName`), combine prices data from `$postData` and write it back

  $error = '';

  // Send message...
  if (!$error) {
    $responseData['ok'] = true;
    http_response_code(200);
  } else {
    sendError($error);
    die;
  }

  // Return json response...
  header('Content-Type: application/json; charset=utf-8');
  $jsonParams = $isDebug ? JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT : 0;
  print(json_encode($responseData, $jsonParams) . NL);
}

// Start...

// DEBUG
if ($isDebug) {
  error_log('Debug: ' . $isDebug . NL);
  error_log('clientIp: ' . $clientIp . NL);
  error_log('pageUrl: ' . $pageUrl . NL);
  error_log('specialFields: ' . print_r($specialFields, true) . NL);
}

$postData = $isTest ? loadJsonFile($sampleUpdatePricesDataFileName) : getPostData();

// DEBUG: Sample error...
if (@$postData['name'] == 'test-error') {
  sendError('Эмуляция ошибки (test error)');
  die;
}

// $data = loadData();
// $data['zz'] = 1;
// saveData($data);

try {
  if (!$isTest) {
    checkEnvironment();
    checkFormData();
  }
  processUpdates($postData);
} catch (Exception $err) {
  $errText = "Caught error: " . $err->getMessage() . NL;
  sendError($errText);
  die;
}
