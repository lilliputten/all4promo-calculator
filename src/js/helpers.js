// @ts-check

import { isDev } from './config';
import { ServerDataError } from './ServerDataError';
import {
  getAllDataTypeItems,
  // getDataTypeSelectedItems,
  // showDataStruct,
} from './show-structure';
import { getErrorText } from './strings';

/** Check if the page is in a 'manager'  mode?
 * @return {AppMode}
 */
export function getAppMode() {
  const { pathname, search } = window.location;
  if (pathname === '/manage' || (isDev && search === '?manage')) {
    return 'manage';
  }
  if (pathname === '/editor' || (isDev && (pathname === '/editor.html' || search === '?editor'))) {
    return 'editor';
  }
  return undefined;
}

/** DEBUG: Print the data structure tree/options
 * @param {DataJson} data
 */
export function debugDataStruct(data) {
  /*
   * const showTree = true;
   * const title = !showTree ? 'Options' : 'Structure';
   * const struct = showDataStruct(data, !showTree);
   * // eslint-disable-next-line no-console
   * console.log(title + ':\n' + struct);
   */
  const allItems = getAllDataTypeItems(data, { getAll: true });
  // const firstItems = getDataTypeSelectedItems(data.types[0], { getAll: true });
  // eslint-disable-next-line no-console
  console.log('All items:\n' + allItems.join('\n'));
}

/** @param {ServerDataError|Error|string} err */
export function showGlobalError(err) {
  const errorNode = document.getElementById('global-error');
  if (!errorNode) {
    // TODO: To create the node?
    return;
  }
  document.body.classList.toggle('with-error', true);
  errorNode.classList.toggle('visible', true);
  const title = getErrorText(err);
  const details = err instanceof ServerDataError ? err.details : '';
  const titleNode = /** @type {HTMLElement} */ (errorNode.querySelector('.error-title'));
  const detailsNode = /** @type {HTMLElement} */ (errorNode.querySelector('.error-details'));
  if (titleNode && detailsNode) {
    titleNode.innerText = title;
    detailsNode.innerText = details || '';
  } else {
    errorNode.innerText = [title, details].filter(Boolean).join('\n\n');
  }
}
