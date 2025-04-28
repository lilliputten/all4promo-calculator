// @ts-check

import { createApp } from 'vue/dist/vue.esm-bundler';

import { Swiper, SwiperSlide } from 'swiper/vue';

import { formatPriceToStr, parsePriceFromStr } from './numbers';
import { getErrorText } from './strings';
import { isDev } from './config';
import { showErrorToast, showSuccessToast } from './toast';
import { ServerDataError } from './ServerDataError';
import { saveCostChangesToServer } from './data';
import { debugDataStruct } from './helpers';

/** DEBUG: Emulate changes at start */
const debugInitialChanges = false;

/** TODO: Add implementation type for app core object via jsdoc
 * @typedef {Object} AppCore
 * @property {DataJson} data
 */

/** Create global application
 * @param {DataJson} serverData
 * @return {import('vue').App<Element>}
 */
export function createEditorApp(serverData) {
  const appCore = {
    /** @param {MouseEvent} ev */
    passHandler(ev) {
      ev.preventDefault();
      return false;
    },

    /** @param {HTMLElement} target */
    getAllDataForWrapperChild(target) {
      const wrapper = /** @type {HTMLElement} */ (target.closest('div.data-type-wrapper'));
      if (!wrapper) {
        throw new Error('Can not find prices wrapper');
      }
      const { dataset } = wrapper;
      const typeIdx = Number(dataset.typeIdx);
      if (isNaN(typeIdx)) {
        throw new Error('Undefined data type index');
      }
      /** @type {number[][]} */
      const pricesSelected = this.pricesSelected;
      const selectedList = pricesSelected[typeIdx]
        ? pricesSelected[typeIdx]
        : (pricesSelected[typeIdx] = []);
      /** @type {DataJson} */
      const data = this.data;
      const dataType = data.types[typeIdx];
      const { prices } = dataType;
      return {
        wrapper,
        dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        data,
        dataType,
        prices,
      };
    },

    /** @param {HTMLElement} target */
    getAllDataForRowChild(target) {
      const row = target.closest('tr');
      if (!row) {
        throw new Error('Can not find prices row');
      }
      const { dataset } = row;
      const typeIdx = Number(dataset.typeIdx);
      if (isNaN(typeIdx)) {
        throw new Error('Undefined data type index');
      }
      /** @type {number[][]} */
      const pricesSelected = this.pricesSelected;
      const selectedList = pricesSelected[typeIdx]
        ? pricesSelected[typeIdx]
        : (pricesSelected[typeIdx] = []);
      /** @type {DataJson} */
      const data = this.data;
      const dataType = data.types[typeIdx];
      const { prices } = dataType;
      const rowIdx = Number(dataset.idx);
      const isHeader = isNaN(rowIdx);
      return {
        row,
        dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        data,
        dataType,
        prices,
        rowIdx,
        isHeader,
      };
    },

    /** @param {MouseEvent} ev */
    deleteSelectedPrices(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const {
        row,
        // dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        // data,
        dataType,
        prices,
      } = this.getAllDataForWrapperChild(target);
      console.log('[deleteSelectedPrices]', {
        ev,
        row,
      });
      if (prices && selectedList.length) {
        dataType.prices = prices.filter((_item, itemIdx) => !selectedList.includes(itemIdx));
        pricesSelected[typeIdx] = [];
        this.pricesHasChanged = true;
        if (!this.pricesChangedDataTypes.includes(typeIdx)) {
          this.pricesChangedDataTypes.push(typeIdx);
        }
      }
    },

    /** @param {MouseEvent} ev */
    onCheckCellClick(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const {
        // row,
        // dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        // data,
        // dataType,
        prices,
        rowIdx,
        isHeader,
      } = this.getAllDataForRowChild(target);
      /* console.log('[onCheckCellClick]', {
       *   isHeader,
       *   selectedList,
       *   pricesSelected,
       *   rowIdx,
       *   typeIdx,
       *   dataset,
       *   target,
       *   row,
       *   ev,
       * });
       */
      if (isHeader) {
        if (selectedList.length) {
          pricesSelected[typeIdx] = [];
        } else if (prices?.length) {
          pricesSelected[typeIdx] = prices.map((_, n) => n);
        }
      } else {
        if (selectedList.includes(rowIdx)) {
          pricesSelected[typeIdx] = selectedList.filter((n) => n != rowIdx);
        } else {
          pricesSelected[typeIdx] = selectedList.concat(rowIdx);
        }
      }
      pricesSelected[typeIdx].sort((a, b) => a - b);
      // console.log('[onCheckCellClick] done:', pricesSelected[typeIdx].join(', '));
    },

    /** @param {number} val */
    formatPrice(val) {
      return formatPriceToStr(val);
    },

    /** @return {DataType | undefined} */
    getCurrentDataType() {
      /** @type {DataJson} */
      const data = this.data;
      /** Selected data type
       * @type {DataType | undefined}
       */
      const dataType = data.types.find(({ selected }) => !!selected);
      if (!dataType) {
        // eslint-disable-next-line no-console
        console.warn('[getCurrentDataType] No data type selected!');
        return undefined;
      }
      return dataType;
    },

    /**
     * @param {number} typeIdx
     * @param {PriceItem} price
     */
    updatePriceRow(typeIdx, price) {
      price.unitCost = parsePriceFromStr(price.unitMaterial) * parsePriceFromStr(price.basicCost);
      this.pricesHasChanged = true;
      if (!this.pricesChangedDataTypes.includes(typeIdx)) {
        this.pricesChangedDataTypes.push(typeIdx);
      }
    },

    /** Handle update of a basic cost field
     * @param {InputEvent} ev
     */
    onPriceNumericFieldChanged(ev) {
      const target = /** @type {HTMLInputElement} */ (ev.currentTarget);
      const fieldId = target.id;
      const {
        // row,
        // dataset,
        typeIdx,
        // pricesSelected,
        // selectedList,
        // data,
        // dataType,
        prices,
        rowIdx,
      } = this.getAllDataForRowChild(target);
      if (!prices) {
        throw new Error('Prices data not defined for the DataType!');
      }
      const price = prices[rowIdx];
      if (!price) {
        throw new Error('Not found price item for idx: ' + rowIdx);
      }
      const value = target.value;
      const parsedValue = parsePriceFromStr(value);
      /* // DEBUG
       * const reasonId = [fieldId, rowIdx, value].filter(Boolean).join(': ');
       * console.log('[onPriceNumericFieldChanged]', reasonId, {
       *   fieldId,
       *   parsedValue,
       *   value,
       *   typeIdx,
       *   rowIdx,
       *   price,
       *   // prices,
       * });
       */
      price[fieldId] = parsedValue;
      this.updatePriceRow(typeIdx, price);
    },

    /** Save changed data on the server */
    async saveCostChanges() {
      /** @type {DataJson} */
      const data = this.data;
      /** @type {number[]} */
      const pricesChangedDataTypes = this.pricesChangedDataTypes;
      try {
        const _resData = await saveCostChangesToServer(data, pricesChangedDataTypes);
        /*
         * console.log('[saveCostChanges] success: Got data (parsed json)', {
         *   resData,
         * });
         */
        this.pricesHasChanged = false;
        this.pricesChangedDataTypes = [];
        showSuccessToast('Данные сохранены');
      } catch (err) {
        const details = getErrorText(err);
        const error = new ServerDataError('Ошибка сохранения данных', details);
        // eslint-disable-next-line no-console
        console.error('[saveCostChanges] Network error', error.message, {
          details,
          err,
          error,
        });
        debugger; // eslint-disable-line no-debugger
        showErrorToast(error);
      }
    },

    /**
     * @param {any[]} arr
     */
    getSelected(arr) {
      return arr.find((el) => el.selected);
    },

    /**
     * @param {InputEvent} ev
     */
    onPriceFieldUpdated(ev) {
      const target = /** @type {HTMLInputElement} */ (ev.currentTarget);
      const { typeIdx, prices, rowIdx } = this.getAllDataForRowChild(target);
      if (!prices) {
        throw new Error('Prices data not defined for the DataType!');
      }
      const price = prices[rowIdx];
      if (!price) {
        throw new Error('Not found price item for idx: ' + rowIdx);
      }
      this.updatePriceRow(typeIdx, price);
    },
  };

  // Create Vue app
  return createApp({
    data(_app) {
      return {
        isDev,
        // fullMode, // boolean,
        pricesSelected: [], // number[][]
        pricesHasChanged: isDev && debugInitialChanges, // boolean
        pricesChangedDataTypes: isDev && debugInitialChanges ? [0] : [], // number[]
        data: null, // DataJson
        preloaded: false,
      };
    },
    components: {
      Swiper,
      SwiperSlide,
    },
    setup() {
      const onSwiper =
        /** @param {Swiper} _swiper */
        (_swiper) => {};
      return {
        onSwiper,
      };
    },
    async mounted() {
      /* // Toasts test
       * showSuccessToast('App edit');
       * // setTimeout(() => {
       * //   showErrorToast('Long body text');
       * // }, 7000);
       */
      const data = serverData;
      // debugDataStruct(data);
      this.data = data;
      // Select the first top-level type
      // this.setList(0);
      this.preloaded = true;
    },
    methods: appCore,
  });
}
