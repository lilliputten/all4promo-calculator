// @ts-check

import { getErrorText } from './strings';
import { dataFileUrl } from './config';
import { ServerDataError } from './ServerDataError';
import { defaultContentType, updatePricesUrl } from './config';

/** @return {Promise<DataJson>} */
export async function loadServerData() {
  const url = dataFileUrl;
  /** @type {string|undefined} */
  let text;
  try {
    const res = await fetch(url);
    const { ok, status, statusText } = res;
    // eslint-disable-next-line no-console
    console.log('[loadServerData] Got response', {
      ok,
      status,
      statusText,
      res,
    });
    if (!ok) {
      const reason = [status, statusText].filter(Boolean).join(', ');
      const msg = [
        'Ошибка отправки запроса',
        // Reson?
        reason && `(${reason})`,
      ]
        .filter(Boolean)
        .join(' ');
      throw new Error(msg);
    }
    text = await res.text();
    // eslint-disable-next-line no-console
    console.log('[loadServerData] success: Got plain content', {
      text,
    });
  } catch (err) {
    const details = getErrorText(err);
    const error = new ServerDataError('Невозможно получить файл данных', details);
    // eslint-disable-next-line no-console
    console.error('[loadServerData] Network error', error.message, {
      url,
      details,
      err,
      error,
    });
    debugger; // eslint-disable-line no-debugger
    throw error;
  }
  try {
    /** @type {DataJson} */
    const data = JSON.parse(text);
    // eslint-disable-next-line no-console
    console.log('[loadServerData] success: Got parsed data', {
      data,
    });
    if (!data) {
      const error = new Error('Не получено данных с сервера.');
      // eslint-disable-next-line no-console
      console.error('[start]', error.message, {
        error,
      });
      debugger; // eslint-disable-line no-debugger
      throw error;
    }
    return data;
  } catch (err) {
    const details = getErrorText(err);
    const error = new ServerDataError('Ошибка чтения данных', details);
    // eslint-disable-next-line no-console
    console.error('[loadServerData] Data error', error.message, {
      details,
      err,
      error,
    });
    debugger; // eslint-disable-line no-debugger
    throw error;
  }
}

/** Send updated prices data to server
 * @param {DataJson} data
 * @param {number[]} pricesChangedDataTypes
 */
export async function saveCostChangesToServer(data, pricesChangedDataTypes) {
  const changedPricesData = pricesChangedDataTypes.map((idx) => {
    return {
      idx,
      prices: data.types[idx].prices,
    };
  });
  const reqUrl = updatePricesUrl;
  /** @type {RequestInit} */
  const reqInit = {
    method: 'POST',
    headers: {
      Accept: defaultContentType,
      'Content-Type': defaultContentType,
    },
    body: JSON.stringify({ changedPrices: changedPricesData }),
  };
  /* console.log('[saveCostChangesToServer] start', {
   *   changedPricesData,
   *   reqInit,
   *   reqUrl,
   *   // yamlData,
   *   data,
   * });
   */
  const res = await fetch(reqUrl, reqInit);
  const { ok, status, statusText } = res;
  // eslint-disable-next-line no-console
  console.log('[saveCostChangesToServer] response', {
    ok,
    status,
    statusText,
    res,
  });
  if (!ok) {
    const reason = [status, statusText].filter(Boolean).join(', ');
    const msg = ['Ошибка отправки запроса', reason && `(${reason})`].filter(Boolean).join(' ');
    throw new Error(msg);
  }
  const resText = await res.text(); // res.json();
  // eslint-disable-next-line no-console
  console.log('[saveCostChangesToServer] success: Got data (raw)', resText);
  if (resText.startsWith('{') || resText.startsWith('[')) {
    const resData = JSON.parse(resText);
    const { error } = resData;
    if (error) {
      const msg = ['Ошибка сервера', error].filter(Boolean).join(': ');
      throw new Error(msg);
    }
    /* console.log('[saveCostChangesToServer] success: Got data (parsed json)', {
     *   resData,
     * });
     */
    return resData;
  } else {
    const error = new ServerDataError('Неверный формат данных');
    // eslint-disable-next-line no-console
    console.error('[saveCostChangesToServer]', error.message, {
      resText,
      error,
    });
    debugger; // eslint-disable-line no-debugger
    throw error;
  }
}
