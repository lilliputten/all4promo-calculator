// @ts-check

import { createApp } from 'vue/dist/vue.esm-bundler';

import { Swiper, SwiperSlide } from 'swiper/vue';

import { formatPriceToStr, parsePriceFromStr } from './numbers';
import { getErrorText } from './strings';
import { isDev } from './config';
import { showErrorToast, showSuccessToast } from './toast';
import { ServerDataError } from './ServerDataError';
import { saveCostChangesToServer } from './data';
import { getDataTypeSelectedItems } from './show-structure';

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
      const priceRowIdx = Number(dataset.idx);
      const isHeader = isNaN(priceRowIdx);
      const price = !isHeader && prices ? prices[priceRowIdx] : undefined;
      return {
        row,
        dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        data,
        dataType,
        prices,
        price,
        priceRowIdx,
        isHeader,
      };
    },

    /** @param {MouseEvent} ev */
    onConditionModalItemClick(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const textNode = /** @type {HTMLElement} */ (target.querySelector('.text'));
      const text = textNode?.innerText;
      /** @type {string[]} */
      const addConditionsSelected = this.addConditionsSelected;
      if (this.addConditionsSelected.includes(text)) {
        this.addConditionsSelected = addConditionsSelected.filter((it) => it !== text);
      } else {
        this.addConditionsSelected = addConditionsSelected.concat(text);
      }
    },

    onConditionModalSave() {
      /** @type {DataJson} */
      const data = this.data;
      /** @type {string[]} */
      const addConditionsSelected = this.addConditionsSelected;
      /** @type {number} */
      const typeIdx = this.addConditionsTypeIdx;
      /** @type {number} */
      const priceRowIdx = this.addConditionsPriceRowIdx;
      const dataType = data.types[typeIdx];
      const prices = dataType.prices;
      if (!prices) {
        throw new Error('Prices data not defined for the DataType!');
      }
      const price = prices[priceRowIdx];
      if (!price) {
        throw new Error('Not found price item for idx: ' + priceRowIdx);
      }
      price.conditions = price.conditions
        ? price.conditions.concat(addConditionsSelected)
        : addConditionsSelected;
      price.conditions.sort();
      this.pricesHasChanged = true;
      if (!this.pricesChangedDataTypes.includes(typeIdx)) {
        this.pricesChangedDataTypes.push(typeIdx);
      }
    },

    /** @param {MouseEvent} ev */
    onConditionModalAdd(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const textNode = /** @type {HTMLElement} */ (target.querySelector('.text'));
      const text = textNode.innerText;
      /** @type {string[]} */
      const addConditionsSelected = this.addConditionsSelected;
      if (this.addConditionsSelected.includes(text)) {
        this.addConditionsSelected = addConditionsSelected.filter((it) => it !== text);
      } else {
        this.addConditionsSelected = addConditionsSelected.concat(text);
      }
    },

    /** @param {MouseEvent} ev */
    addPriceItem(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const {
        wrapper,
        // dataset,
        typeIdx,
        // pricesSelected,
        // selectedList,
        // data,
        dataType,
        prices,
      } = this.getAllDataForWrapperChild(target);
      /** New row data
       * @type {PriceItem}
       */
      const newPriceItem = {
        conditions: undefined, // string[];
        material: '', // string;
        units: '', // string;
        // The numbers here could be formatted ones in a form like `1,123.99`
        unitMaterial: 0, // number | string;
        basicCost: 0, // number | string;
        unitCost: 0, // number | string;
      };
      // Add a row
      let addedIdx = 0;
      if (!prices) {
        dataType.prices = [newPriceItem];
      } else {
        addedIdx = prices.length;
        dataType.prices = prices.concat(newPriceItem);
      }
      // Set 'updated' flags
      this.pricesHasChanged = true;
      if (!this.pricesChangedDataTypes.includes(typeIdx)) {
        this.pricesChangedDataTypes.push(typeIdx);
      }
      // Show and indicate newly added record
      const rowId = 'price-row-' + typeIdx + '-' + addedIdx;
      setTimeout(() => {
        requestAnimationFrame(() => {
          const row = wrapper.querySelector('tr#' + rowId);
          if (row) {
            row.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            row.classList.add('new');
            setTimeout(() => {
              row.classList.remove('new');
            }, 250);
          }
        });
      }, 50);
    },

    /** @param {MouseEvent} ev */
    deleteSelectedPrices(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const {
        // wrapper,
        // dataset,
        typeIdx,
        pricesSelected,
        selectedList,
        // data,
        dataType,
        prices,
      } = this.getAllDataForWrapperChild(target);
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
    showConditionsModal(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const {
        // row,
        // dataset,
        typeIdx,
        // pricesSelected,
        // selectedList,
        // data,
        dataType,
        // prices,
        price,
        priceRowIdx,
        // isHeader,
      } = this.getAllDataForRowChild(target);
      if (!price) {
        throw new Error('Not found price item for idx: ' + priceRowIdx);
      }
      const addConditionsList = getDataTypeSelectedItems(dataType, { getAll: true });
      const conditions = price.conditions;
      this.addConditionsTypeIdx = typeIdx;
      this.addConditionsPriceRowIdx = priceRowIdx;

      this.addConditionsList = addConditionsList; // string[], current conditions to show in the modal to add to the current price item
      this.addConditionsSelected = []; // string[], selected conditions to add
      this.addConditionsUsed = conditions ? [...conditions] : [];
    },

    /** @param {MouseEvent} ev */
    deleteConditionsItem(ev) {
      const target = /** @type {HTMLElement} */ (ev.currentTarget);
      const { dataset } = target;
      const condIdx = Number(dataset.condIdx);
      const {
        // row,
        // dataset,
        typeIdx,
        // pricesSelected,
        // selectedList,
        // data,
        // dataType,
        // prices,
        price,
        priceRowIdx,
        // isHeader,
      } = this.getAllDataForRowChild(target);
      if (!price) {
        throw new Error('Not found price item for idx: ' + priceRowIdx);
      }
      const conditions = price.conditions;
      if (conditions) {
        price.conditions = conditions.filter((_it, idx) => idx != condIdx);
      }
      this.pricesHasChanged = true;
      if (!this.pricesChangedDataTypes.includes(typeIdx)) {
        this.pricesChangedDataTypes.push(typeIdx);
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
        priceRowIdx,
        isHeader,
      } = this.getAllDataForRowChild(target);
      if (!prices || !prices.length) {
        return;
      }
      if (isHeader) {
        if (selectedList.length >= prices.length) {
          pricesSelected[typeIdx] = [];
        } else {
          pricesSelected[typeIdx] = prices.map((_, n) => n);
        }
      } else {
        if (selectedList.includes(priceRowIdx)) {
          pricesSelected[typeIdx] = selectedList.filter((n) => n != priceRowIdx);
        } else {
          pricesSelected[typeIdx] = selectedList.concat(priceRowIdx);
        }
      }
      pricesSelected[typeIdx].sort((a, b) => a - b);
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
        // prices,
        price,
        priceRowIdx,
      } = this.getAllDataForRowChild(target);
      if (!price) {
        throw new Error('Not found price item for idx: ' + priceRowIdx);
      }
      const value = target.value;
      const parsedValue = parsePriceFromStr(value);
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
        await saveCostChangesToServer(data, pricesChangedDataTypes);
        /* // XXX FUTURE: It's possible to get the results here and update all the data
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
      const { typeIdx, prices, priceRowIdx } = this.getAllDataForRowChild(target);
      if (!prices) {
        throw new Error('Prices data not defined for the DataType!');
      }
      const price = prices[priceRowIdx];
      if (!price) {
        throw new Error('Not found price item for idx: ' + priceRowIdx);
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
        addConditionsTypeIdx: undefined, // number
        addConditionsPriceRowIdx: undefined, // number
        addConditionsList: ['xxx'], // string[], current conditions to show in the modal to add to the current price item
        addConditionsUsed: [], // string[], selected conditions to add
        addConditionsSelected: [], // string[], selected conditions to add
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
