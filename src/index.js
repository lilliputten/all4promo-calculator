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
    let app;
    if (appMode === 'editor') {
      app = createEditorApp(data);
    } else {
      const fullMode = appMode === 'manage';
      app = createCalculatorApp(data, fullMode);
    }
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
