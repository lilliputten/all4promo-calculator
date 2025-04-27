// @ts-check

const DELIM = ' / ';
const NL = '\n';
const SP = '    ';

/**
 * @param {TypeOption} data
 * @param {GetItemOptions} opts
 * @param {string} prefix
 */
function getTypeOptionSelectedItems(data, opts = {}, prefix = '') {
  const name = data.name;
  const selectionsChoose = data.selectionsChoose;
  /** @type {string[]} */
  const arr = [];
  prefix = [prefix, name].filter(Boolean).join(DELIM);
  if (data.selected) {
    arr.push(prefix);
  }
  const selections = data.selections;
  if (selections) {
    if (opts.getAll) {
      const items = selections.map(({ name }) => prefix + DELIM + name);
      Array.prototype.push.apply(arr, items);
    } else {
      const selection = selections.find(({ name }) => name === selectionsChoose);
      if (selection) {
        arr.push(prefix + DELIM + selection.name);
      }
    }
  }
  return arr;
}

/**
 * @param {TypeType} data
 * @param {GetItemOptions} opts
 * @param {string} prefix
 */
function getTypeTypeSelectedItems(data, opts = {}, prefix = '') {
  const name = data.title;
  // name = 'TypeType: ' + name;
  /** @type {string[]} */
  const arr = [];
  prefix = [prefix, name].filter(Boolean).join(DELIM);
  const options = data.options;
  options
    .filter(({ selected }) => opts.getAll || selected)
    .forEach((it) => {
      /** @type {string[]} */
      const items = getTypeOptionSelectedItems(it, opts, prefix);
      if (items.length) {
        Array.prototype.push.apply(arr, items);
      }
    });
  return arr;
}

/** The main method to get all the sub-options for the DataType
 * @param {DataType} data
 * @param {GetItemOptions} opts
 * @param {string} prefix
 */
export function getDataTypeSelectedItems(data, opts = {}, prefix = '') {
  const name = data.name;
  /** @type {string[]} */
  const arr = [];
  if (opts.topLevelPrefix) {
    prefix = [prefix, name].filter(Boolean).join(DELIM);
  }
  const typeTypes = data.types;
  typeTypes.forEach((it) => {
    /** @type {string[]} */
    const items = getTypeTypeSelectedItems(it, opts, prefix);
    if (items.length) {
      Array.prototype.push.apply(arr, items);
    }
  });
  return arr;
}

/** Get all the items
 * @param {DataJson} data
 * @param {GetItemOptions} opts
 * @param {string} prefix
 */
export function getAllDataTypeItems(data, opts = {}, prefix = '') {
  /** @type {string[]} */
  const arr = [];
  const nextOpts = { topLevelPrefix: true, ...opts };
  data.types.forEach((dataType) => {
    const items = getDataTypeSelectedItems(dataType, nextOpts, prefix);
    if (items.length) {
      Array.prototype.push.apply(arr, items);
    }
  });
  return arr;
}

// DEBUG: Below are the data structure tree/options getters. See the entry point function `showDataStruct` below.

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
    s = prefix + DELIM + name + NL;
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
    prefix += DELIM + name;
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
  const name = data.title;
  // name = 'SubType: ' + name;
  // const attrs = [
  //   // Attrs..
  //   data.colors && 'цвет',
  //   data.checkbox && 'чекбокс',
  // ].filter(Boolean);
  // if (attrs.length) {
  //   name += ' (' + attrs.join(', ') + ')';
  // }
  let s = '';
  if (prefix) {
    prefix += DELIM + name;
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
export function showTopLevel(data, showPrefix, level) {
  const sp = SP.repeat(level);
  const name = data.name;
  // name = 'TopLevel: ' + name;
  let s = '';
  const prefix = showPrefix ? name : '';
  // s += prefix + NL;
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
  return data.types.map((it) => showTopLevel(it, showPrefix, level)).join('');
}
