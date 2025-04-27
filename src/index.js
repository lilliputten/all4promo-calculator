// @ts-check

import { showErrorToast } from './js/toast';
import { loadServerData } from './js/data';
import { getAppMode, showGlobalError } from './js/helpers';

import { createCalculatorApp } from './js/app-calculator';
import { createEditorApp } from './js/app-editor';

import 'swiper/css';

import './scss/index.scss';

async function start() {
  try {
    const data = await loadServerData();
    const appMode = getAppMode();
    /** @type {import('vue').App} */
    const app =
      appMode === 'editor'
        ? createEditorApp(data)
        : createCalculatorApp(data, appMode === 'manage');
    window.globalApp = app.mount('#app');
  } catch (err) {
    const error = /** @type {import('src/@types/ErrorLike').ErrorLike} */ (err);
    // eslint-disable-next-line no-console
    console.error('[start] error', {
      error,
    });
    debugger; // eslint-disable-line no-debugger
    // Show error pane over the application
    showGlobalError(error);
    // Show error toast?
    showErrorToast(error);
  }
}

start();
