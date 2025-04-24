// @ts-check

/** Make periods for long numbers. Returns string presentation of number.
 * @param {string|number} num
 * @param {string} [periodChar=',']
 * @return {string}
 */
export function periodizeNumber(num, periodChar = ',') {
  // periodChar = periodChar || ' ';
  let numStr = String(num);
  // If long number...
  if (numStr.length > 3 && !numStr.match(/\D/)) {
    numStr = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, periodChar);
  }
  return numStr;
}
