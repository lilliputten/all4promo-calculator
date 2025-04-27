// @ts-check

import { Toast } from 'bootstrap';
import { getErrorText } from './strings';

/** @type {Record<ToastType, string>} */
const bgClasses = {
  info: 'bg-primary',
  error: 'bg-danger',
  success: 'bg-success',
};

/** @type {Record<ToastType, string>} */
const textClasses = {
  error: 'text-danger',
  info: 'text-primary',
  success: 'text-success',
};

/** @type {Record<ToastType, string>} */
const iconClasses = {
  error: 'exclamation',
  info: 'info',
  success: 'check',
};

/** @type {HTMLElement} */
let toastNode;

let toastInstance;

function getToastNode() {
  if (!toastNode) {
    toastNode = /** @type {HTMLElement} */ (document.getElementById('toast-node'));
  }
  return toastNode;
}

function getToastInstance() {
  if (!toastInstance) {
    const node = getToastNode();
    toastInstance = new Toast(node);
  }
  return toastInstance;
}

/**
 * @param {HTMLElement} node
 * @param {string} removeClassPrefix
 * @param {string} replaceClass
 */
function replaceNodeClasses(node, removeClassPrefix, replaceClass) {
  const regEx = new RegExp('\\b(' + removeClassPrefix + '\\S*)\\b', 'g');
  // const match = node.className.match(/\b(text-bg-\S+)\b/g);
  const match = node.className.match(regEx);
  if (match && match.length) {
    match.forEach((str) => {
      if (str !== replaceClass) {
        node.classList.remove(str);
      }
    });
    // Remove fpound classes
  }
  node.classList.toggle(replaceClass, true);
}

/** @param {ToastParams} params */
function updateToastNode(params) {
  const { type = 'info' } = params;
  const node = getToastNode();
  replaceNodeClasses(node, 'bg-', bgClasses[type]);
  // const iconWrapperNode = [>* @type {HTMLElement} <] (node.querySelector('.toast-icon-wrapper'));
  // if (iconWrapperNode) {
  //   replaceNodeClasses(iconWrapperNode, 'bg-', bgClasses[type]);
  // }
  const iconNode = /** @type {HTMLElement} */ (node.querySelector('#toast-icon'));
  if (iconNode) {
    // replaceNodeClasses(iconNode, 'text-', textClasses[type]);
    iconNode.className = textClasses[type] + ' bi bi-' + iconClasses[type];
  }
  const titleNode = /** @type {HTMLElement} */ (node.querySelector('#toast-title'));
  if (titleNode) {
    titleNode.innerText = params.title || '';
  }
  const bodyNode = /** @type {HTMLElement} */ (node.querySelector('#toast-body'));
  if (bodyNode) {
    bodyNode.innerText = params.body || '';
  }
}

/** @param {ToastParams} params */
export function showToast(params) {
  updateToastNode(params);
  const instance = getToastInstance();
  instance.show();
}

/** @param {Error|string} body */
export function showErrorToast(body) {
  showToast({ type: 'error', body: getErrorText(body) });
}

/** @param {string} body */
export function showInfoToast(body) {
  showToast({ type: 'info', body });
}

/** @param {string} body */
export function showSuccessToast(body) {
  showToast({ type: 'success', body });
}
