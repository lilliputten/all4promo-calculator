// @ts-check

import { createApp } from 'vue/dist/vue.esm-bundler';
// import { createApp } from '@vue/runtime-dom';

import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';

import axios from 'axios';
import html2canvas from 'html2canvas';

import { getDocument } from '../pdf.mjs';

import { getDataTypeSelectedItems, showDataStruct } from './show-structure';
import { formatPriceToStr, parsePriceFromStr } from './numbers';
import { parseQuery } from './urls';

/** The data
 * @type {DataJson}
 */
import dataJson from '../data/data.yaml';

import '../scss/index.scss';

const urlParams = parseQuery(window.location.search);
const fullMode = urlParams.mode == 'full';

/** Print the data structure tree/options
 * @param {DataJson} data
 * @param {boolean} showOptions
 */
function debugDataStruct(data, showOptions) {
  const title = showOptions ? 'Options' : 'Structure';
  const struct = showDataStruct(data, showOptions);
  // eslint-disable-next-line no-console
  console.log(title + ':\n' + struct);
}

// Create Vue app
export const globalApp = createApp({
  data(_app) {
    return {
      fullMode,
      preloaded: false,
      title: null,
      edition: 10, // number of items to produce
      logo: null,
      comment: null,
      priceUnit: null,
      priceTotal: null,
      filteredPrices: [], // PriceItem[]
      date: new Date(),
      data: null, // DataJson
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
    const data = /** @type {DataJson} */ (dataJson);
    debugDataStruct(data, true);
    /* // DEBUG
     * const app = this;
     * console.log('[mounted]', {
     *   test: data.types[0].prices,
     *   app: { ...app },
     * });
     */
    this.data = data;
    // Select the first top-level type
    this.setList(0);
    setTimeout(() => {
      this.preloaded = true;
      const observerLogo = new MutationObserver((mutations) => {
        mutations.forEach((mutationRecord) => {
          const node = /** @type {HTMLElement} */ (mutationRecord.target);
          const mutation = node.getAttribute('style');
          this.$refs.logoElementBottom.setAttribute('style', mutation);
        });
      });

      const targetLogo = this.$refs.logoElement;
      observerLogo.observe(targetLogo, { attributes: true, attributeFilter: ['style'] });

      const dragElement =
        /** @param {HTMLElement} elmnt */
        (elmnt) => {
          let pos1 = 0;
          let pos2 = 0;
          let pos3 = 0;
          let pos4 = 0;
          const garabber = /** @type {HTMLElement} */ (elmnt.querySelector('.element'));
          if (document.getElementById(elmnt.id + 'header')) {
            const node = document.getElementById(elmnt.id + 'header');
            if (node) {
              node.onmousedown = dragMouseDown;
            }
          } else {
            if (garabber) {
              garabber.onmousedown = dragMouseDown;
            }
          }

          /** @param {MouseEvent} e */
          function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
          }

          /** @param {MouseEvent} e */
          function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
            elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
          }

          function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
          }
        };

      dragElement(targetLogo);
    }, 2000);
  },
  methods: {
    /**
     * @param {number} val
     */
    formatPrice(val) {
      return formatPriceToStr(val);
    },
    /**
     * @return {DataType | undefined}
     */
    getCurrentDataType() {
      /** @type {DataJson} */
      const data = this.data;
      /** Selected data type
       * @type {DataType | undefined}
       */
      const dataType = data.types.find(({ selected }) => !!selected);
      if (!dataType) {
        console.warn('[getCurrentDataType] No data type selected!');
        return undefined;
      }
      return dataType;
    },
    /**
     * @param {string} reason
     */
    calcPrice(reason, reasonId = '') {
      /** Selected data type
       * @type {DataType | undefined}
       */
      const dataType = this.getCurrentDataType(); // data.types.find(({ selected }) => !!selected);
      if (!dataType) {
        // eslint-disable-next-line no-console
        console.warn('[calcPrice]', reason, reasonId, 'No data type selected!');
        debugger; // eslint-disable-line no-debugger
        return;
      }
      const selectedItems = getDataTypeSelectedItems(dataType);
      const { prices } = dataType;
      const filteredPrices = /** @type {PriceItem[] | undefined} */ (
        prices
          ?.map((price, idx) => {
            const { conditions } = price;
            if (conditions) {
              // Unfilter a price entry if any of conditions aren't presented in currently selected items
              for (const condItem of conditions) {
                if (!selectedItems.includes(condItem)) {
                  return null;
                }
              }
            }
            return /** @type {PriceItem} */ ({
              _idx: idx,
              ...price,
            });
          })
          .filter(Boolean)
      );
      const count = !this.edition || isNaN(this.edition) ? 1 : this.edition;
      console.log('[calcPrice]', reason, reasonId, {
        filteredPrices,
        prices: { ...prices },
        selectedItems,
        dataType: { ...dataType },
        count,
      });
      this.filteredPrices = filteredPrices;
      this.priceUnit = filteredPrices?.reduce((summ, price) => {
        return summ + parsePriceFromStr(price.unitCost);
      }, 0);
      this.priceTotal = isNaN(this.priceUnit) ? 0 : this.priceUnit * count;
    },
    /**
     * @param {InputEvent} e
     */
    onBasicCostChange(e) {
      /** Selected data type
       * @type {DataType | undefined}
       */
      const dataType = this.getCurrentDataType(); // data.types.find(({ selected }) => !!selected);
      if (!dataType) {
        // eslint-disable-next-line no-console
        console.error('[onBasicCostChange] No data type selected!');
        debugger; // eslint-disable-line no-debugger
        return;
      }
      const prices = dataType.prices;
      if (!prices) {
        // eslint-disable-next-line no-console
        console.error('[onBasicCostChange] Prices data not defined for the DataType!');
        debugger; // eslint-disable-line no-debugger
        return;
      }
      const node = /** @type {HTMLInputElement} */ (e.target);
      const { dataset } = node;
      const idx = dataset.idx;
      if (idx == undefined || idx == '' || isNaN(Number(idx))) {
        // eslint-disable-next-line no-console
        console.error('[onBasicCostChange] Prices data not defined for the DataType!');
        debugger; // eslint-disable-line no-debugger
        return;
      }
      const idxN = Number(idx);
      /** @type {PriceItem | undefined } */
      const price = prices[idxN];
      if (!price) {
        // eslint-disable-next-line no-console
        console.error('[onBasicCostChange] Not found price item for idx: ' + idx);
        debugger; // eslint-disable-line no-debugger
        return;
      }
      const value = node.value;
      const parsedValue = parsePriceFromStr(value);
      price.basicCost = parsedValue;
      price.unitCost = parsePriceFromStr(price.unitMaterial) * parsedValue;
      const reasonId = ['basicCost', idx, value].filter(Boolean).join(': ');
      console.log('[onBasicCostChange]', reasonId, {
        parsedValue,
        value,
        idxN,
        idx,
        prices,
        dataType: { ...dataType },
      });
      this.calcPrice('onBasicCostChange', reasonId);
    },
    /** Set the topmost level type (DataType)
     * @param {number} num
     */
    async setList(num) {
      console.log('[setList]', num);
      const data = /** @type {DataJson} */ (this.data);
      /** @type {string | undefined} */
      let reasonId;
      data.types.forEach((_el, index) => {
        const isSelected = num === index;
        data.types[index].selected = isSelected;
        if (isSelected) {
          reasonId = data.types[index].name;
        }
      });
      const item = data.types[num];
      // item.selected = true;
      /* // We don't have colors on the top level of `DataType`
       * if (item?.colors?.length) {
       *   item?.colors?.forEach((el, index) => {
       *     el.selected = !index;
       *   });
       * }
       */
      if (item?.types?.length) {
        item.types.forEach((el) => {
          el.options.forEach((/** @type {TypeOption} */ option, /** @type {number} */ idx) => {
            option.selected = !idx;
            if (option.count) {
              option.count = 0;
            }
          });
          if (el?.colors) {
            el.colors.forEach((color, idx) => {
              color.selected = !idx;
            });
          }
        });
      }
      let color = '';
      await Promise.all(
        data.types.map(
          /** @param {DataType & TypeType} type */
          async (type) => {
            if (type.svg) {
              color = type.colors ? this.getSelected(type.colors)?.code : null;
              if (type.svgNew) {
                type.svgNew = this.changeColor(type.svgNew, color);
              } else {
                type.svgNew = await this.fetchSvg(type.svg, color);
              }
              /* console.log('XXX', {
               *   type: {...type},
               * });
               */
            }
            await Promise.all(
              type.types.map(async (t) => {
                await Promise.all(
                  t.options.map(async (option) => {
                    if (option.svg) {
                      color = t.colors ? this.getSelected(t.colors)?.code : null;
                      if (option.svgNew) {
                        option.svgNew = this.changeColor(option.svgNew, color);
                      } else {
                        option.svgNew = await this.fetchSvg(option.svg, color);
                      }
                    }
                  }),
                );
              }),
            );
          },
        ),
      );
      // TODO: Invoke the method after all the above async op's?
      this.calcPrice('setList', reasonId);
    },
    /** The main property change funciton
     * @param {Array<TypeColor>} arr
     * @param {number} num
     * @param {TypeType | null} mainobj
     */
    setProp(arr, num, mainobj = null) {
      const it = arr[num];
      const isCheckbox = !!mainobj?.checkbox;
      const hasColors = !!mainobj?.colors;
      const hasSvgNew = !!mainobj?.svgNew;
      if (!mainobj) {
        // XXX: Is ti possible to have unset mainobj?
        debugger;
      }
      if (isCheckbox) {
        it.selected = !it.selected;
      } else {
        arr.forEach((el, index) => {
          el.selected = num === index;
        });
      }
      const reasonValue = arr
        .filter(({ selected }) => selected)
        .map(({ name }) => name)
        .join(', ');
      const reasonId = [
        //
        mainobj?.title,
        hasColors && arr === mainobj.colors ? 'Color' : 'Option',
        reasonValue,
      ]
        .filter(Boolean)
        .join(': ');
      console.log('[setProp]', mainobj?.title, num, it?.name, {
        reasonId,
        // reasonValue,
        isCheckbox,
        hasColors,
        hasSvgNew,
        num,
        arr: [...arr],
        it: { ...it },
        mainobj: { ...mainobj },
      });
      if (hasColors) {
        const colorCode = this.getSelected(mainobj.colors)?.code;
        if (hasSvgNew) {
          mainobj.svgNew = this.changeColor(mainobj.svgNew, colorCode);
        } else if (this.getSelected(mainobj.options).svgNew) {
          this.getSelected(mainobj.options).svgNew = this.changeColor(
            this.getSelected(mainobj.options).svgNew,
            colorCode,
          );
        }
      }
      this.calcPrice('setProp', reasonId);
    },
    /**
     * @param {any[]} arr
     */
    getSelected(arr) {
      return arr.find((el) => el.selected);
    },
    printHtml() {
      const cl = /** @type {HTMLElement} */ (document.querySelector('#capture'));
      document.querySelector('html')?.classList.add('prntbl');
      html2canvas(cl).then((canvas) => {
        const nWindow = window.open('');
        const style = document.createElement('style');
        style.innerHTML = 'canvas{width: 100%!important; height: auto!important;}';
        if (nWindow) {
          nWindow.document.head.appendChild(style);
          nWindow.document.body.appendChild(canvas);
          nWindow.focus();
          nWindow.print();
        }
        document.querySelector('html')?.classList.remove('prntbl');
      });
    },
    /**
     * @param {string} link
     * @param {string | null} color
     */
    fetchSvg(link, color = null) {
      return new Promise((resolve) => {
        axios.get(link).then((svg) => {
          resolve(this.changeColor(svg.data, color));
        });
      });
    },
    /**
     * @param {string} svg
     * @param {any} color
     */
    changeColor(svg, color) {
      return color ? svg.replace(/fill="[#,a-z,A-Z,0-9]+"/gm, `fill="${color}"`) : svg;
    },
    getEditionCount() {
      let value = Number(this.edition);
      if (isNaN(value) || value < 1) {
        value = 1;
      }
      return value;
    },
    /**
     * @param {InputEvent} e
     */
    onValueChange(e) {
      const node = /** @type {HTMLInputElement} */ (e.target);
      const type = node.dataset.type;
      const name = node.dataset.name;
      const value = node.value;
      const reasonId = [type, name, value].filter(Boolean).join(': ');
      console.log('[onValueChange]', {
        reasonId,
        name,
        type,
        value,
      });
      this.calcPrice('onValueChange', reasonId);
    },
    /**
     * @param {InputEvent} e
     */
    onSelectChange(e) {
      const node = /** @type {HTMLSelectElement} */ (e.target);
      const selectedIndex = Number(node.selectedIndex);
      const selectedOptions = node.selectedOptions;
      const type = node.dataset.type;
      const name = node.dataset.name;
      const option = selectedOptions[0];
      const value = option.value;
      const reasonId = [type, name, value].filter(Boolean).join(': ');
      console.log('[onSelectChange]', {
        reasonId,
        option,
        node,
        selectedIndex,
        selectedOptions,
      });
      this.calcPrice('onSelectChange', reasonId);
    },
    /**
     * @param {InputEvent} e
     */
    onEditionChange(e) {
      const node = /** @type {HTMLInputElement} */ (e.target);
      const value = Number(node.value);
      console.log('[onEditionChange]', {
        edition: this.edition,
        value,
      });
      // TODO: Just to multiply price?
      this.calcPrice('onEditionChange', 'count: ' + value);
    },
    /**
     * @param {InputEvent} e
     */
    onFileChange(e) {
      // @ts-ignore
      const files = e.target?.files || e.dataTransfer.files;
      if (!files.length) return;
      this.createImage(files[0]);
    },
    /** @param {Blob} file */
    createImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logo = '';
        if (file.type === 'application/pdf') {
          getDocument(e.target?.result)
            .promise.then(
              /** @param {import('pdfjs-dist').PDFDocumentProxy} pdf */
              (pdf) => {
                pdf.getPage(1).then((page) => {
                  const scale = 1.5;
                  const viewport = page.getViewport({ scale: scale });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    const renderContext = {
                      canvasContext: context,
                      viewport: viewport,
                    };
                    page.render(renderContext).promise.then(() => {
                      this.logo = canvas.toDataURL();
                    });
                  }
                });
              },
            )
            .catch((/** @type {Error | string} */ reason) => {
              // eslint-disable-next-line no-console
              console.error(reason);
            });
        } else {
          this.logo = e.target?.result;
        }
      };
      reader.readAsDataURL(file);
    },
    removeImage: function (/** @type {Event} */ _e) {
      this.$refs.logoUpload.value = null;
      this.logo = '';
    },
  },
}).mount('#app');
