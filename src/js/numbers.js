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

/**
 * @param {number|string} val
 */
export function formatPriceToStr(val) {
  if (typeof val === 'string') {
    return val;
  }
  if (!val) {
    return '0.00';
  }
  let numStr = val.toFixed(2);
  const parsed = numStr.match(/^(\d+)[,.](\d+)$/);
  if (!parsed) {
    return periodizeNumber(numStr);
  }
  numStr = periodizeNumber(parsed[1]) + '.' + parsed[2];
  return numStr;
}

/**
 * @param {string|number} val
 * @return {number}
 */
export function parsePriceFromStr(val) {
  if (typeof val === 'number') {
    return val;
  }
  if (!val) {
    return 0;
  }
  val = val.replace(/[, ]/g, '');
  const numVal = Number(val);
  if (isNaN(numVal)) {
    return 0;
  }
  return numVal;
}
