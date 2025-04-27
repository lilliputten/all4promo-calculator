// @ts-check

import { isDev } from './config';
import { showDataStruct, getAllDataTypeItems } from './show-structure';
// import { parseQuery } from './urls';

export function checkFullMode() {
  if (window.location.pathname === '/manage') {
    return true;
  }
  if (isDev) {
    return window.location.search === '?manage';
    // const urlParams = parseQuery(window.location.search);
    // return urlParams.mode == 'full';
  }
  return false;
}

/** Print the data structure tree/options
 * @param {DataJson} data
 * @param {boolean} showOptions
 */
export function debugDataStruct(data, showOptions) {
  // const title = showOptions ? 'Options' : 'Structure';
  // const struct = showDataStruct(data, showOptions);
  // // eslint-disable-next-line no-console
  // console.log(title + ':\n' + struct);
  const allItems = getAllDataTypeItems(data, { getAll: true });
  // eslint-disable-next-line no-console
  console.log('All items:\n' + allItems.join('\n'));
}
