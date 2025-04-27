<?

function unix_path(string $path) {
  $path = str_replace('\\', '/', $path);
  return $path;
}

/** Use instead of str_ends_with for php v < 8 */
function str_ends(string $haystack, string $needle) {
  $length = strlen($needle);
  return $length > 0 ? substr($haystack, -$length) === $needle : true;
}

function path_join(string $path1, string $path2) {
  $path = unix_path($path1);
  if (!str_ends($path1, '/')) {
    $path1 .= '/';
  }
  return $path1 . unix_path($path2);
}
