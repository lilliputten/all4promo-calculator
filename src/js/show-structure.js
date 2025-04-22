// @ts-check

const NL = '\n';
const SP = '    ';

// DEBUG: Get the data structure tree/options routines. See the entry point function `showDataStruct` below.

/**
 * @param {TypeSelection} data
 * @param {string} prefix
 * @param {number} level
 */
function showSelection(data, prefix, level) {
  const sp = SP.repeat(level);
  const name = data.name;
  // name = 'Selection: ' + name;
  let s = '';
  if (prefix) {
    s = prefix + ' / ' + name + NL;
  } else {
    sp + '- ' + name + NL;
  }
  return s;
}
/**
 * @param {TypeOption} data
 * @param {string} prefix
 * @param {number} level
 */
function showOption(data, prefix, level) {
  const sp = SP.repeat(level);
  const name = data.name;
  // name = 'Option: ' + name;
  let s = '';
  if (prefix) {
    prefix += ' / ' + name;
  } else {
    s += sp + '- ' + name + NL;
  }
  if (data.selections) {
    s += data.selections.map((it) => showSelection(it, prefix, level + 1)).join('');
  } else {
    s += prefix + NL;
  }
  return s;
}
/**
 * @param {TypeType} data
 * @param {string} prefix
 * @param {number} level
 */
function showSubTypes(data, prefix, level) {
  const sp = SP.repeat(level);
  let name = data.title;
  // name = 'SubType: ' + name;
  const attrs = [
    // Attrs..
    data.colors && 'цвет',
    data.checkbox && 'чекбокс',
  ].filter(Boolean);
  if (attrs.length) {
    name += ' (' + attrs.join(', ') + ')';
  }
  let s = '';
  if (prefix) {
    prefix += ' / ' + name;
  } else {
    s += sp + '- ' + name + NL;
  }
  if (data.options) {
    s += data.options.map((it) => showOption(it, prefix, level + 1)).join('');
  } else if (prefix) {
    s += prefix + NL;
  }
  return s;
}
/**
 * @param {DataType} data
 * @param {boolean} showPrefix
 * @param {number} level
 */
function showTopLevel(data, showPrefix, level) {
  const sp = SP.repeat(level);
  const name = data.name;
  // name = 'TopLevel: ' + name;
  let s = '';
  const prefix = showPrefix ? name : '';
  if (!showPrefix) {
    s += sp + '- ' + name + NL;
  }
  s += data.types.map((it) => showSubTypes(it, prefix, level + 1)).join('');
  return s;
}
/** Get the data structure tree/options printable string
 * @param {DataJson} data
 * @param {boolean} showPrefix
 * @param {number} level
 */
export function showDataStruct(data, showPrefix = false, level = 0) {
  // const sp = SP.repeat(level);
  // const name = data.title;
  let s = '';
  // if (!showPrefix) {
  //   s += sp + '- ' + name + NL;
  // }
  s += data.types.map((it) => showTopLevel(it, showPrefix, level)).join('');
  return s;
}
