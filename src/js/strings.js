// @ts-check

/** getErrorText - Return plain text for error.
 * @param {string|Error|string[]|Error[]} error - Error or errors list.
 * @return {string}
 */
export function getErrorText(error) {
  if (!error) {
    return '';
  }
  if (Array.isArray(error)) {
    return error.map(this.getErrorText.bind(this)).join('\n');
  }
  if (error instanceof Error) {
    error = error.message;
  } else if (typeof error !== 'string') {
    // TODO?
    error = String(error);
  }
  return error;
}
