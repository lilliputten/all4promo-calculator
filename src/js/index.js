// @ts-check

import { createApp } from 'vue/dist/vue.esm-bundler';
// import { createApp } from '@vue/runtime-dom';

import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';

import axios from 'axios';
import html2canvas from 'html2canvas';

import dataJson from '../json/data.json';
import { getDocument } from '../pdf.mjs';

import '../scss/index.scss';

// const createApp2: import('vue').CreateAppFunction<Element>;

// Create Vue app
export const globalApp = createApp({
  data(_app) {
    return {
      preloaded: false,
      title: null,
      edition: null,
      logo: null,
      comment: null,
      price: null,
      data: null,
      date: new Date(),
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
    const app = this;
    console.log('[mounted]', {
      app: {...app},
    });
    this.data = /** @type {DataJson} */ (dataJson);
    // Selecte first top-level type
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
          var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
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
    calcPrice() {
      this.price = 77.5;
      // TODO?
    },
    /** Set the topmost level type (DataType)
     * @param {number} num
     */
    async setList(num) {
      console.log('[setList]', num);
      const data = /** @type {DataJson} */ (this.data);
      data.types.forEach((_el, index) => {
        data.types[index].selected = num === index;
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
          el.options.forEach((/** @type {TypeOption} */ option, /** @type {number} */ i) => {
            option.selected = !i;
            if (option.count) {
              option.count = 0;
            }
          });
          if (el?.colors) {
            el.colors.forEach((color, i) => {
              color.selected = !i;
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
      this.calcPrice();
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
      console.log('[setProp]', mainobj?.title, num, it?.name, {
        isCheckbox,
        hasColors,
        hasSvgNew,
        num,
        arr: [...arr],
        it: {...it},
        mainobj: {...mainobj},
      });
      if (isCheckbox) {
        it.selected = !it.selected;
      } else {
        arr.forEach((el, index) => {
          el.selected = num === index;
        });
      }
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
          debugger;
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
    onEditionChange(e) {
      const node = /** @type {HTMLInputElement} */ (e.target);
      let value = Number(node.value);
      if (isNaN(value)) {
        return;
      }
      console.log('[onEditionChange]', {
        edition: this.edition,
        value,
      })
      // TODO: Just multiple price?
      this.calcPrice();
    },
    /**
     * @param {InputEvent} e
     */
    onFileChange(e) {
      // @ts-ignore
      let files = e.target?.files || e.dataTransfer.files;
      if (!files.length) return;
      this.createImage(files[0]);
    },
    /** @param {Blob} file */
    createImage(file) {
      let reader = new FileReader();
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
            })
            .catch((/** @type {Error | string} */ reason) => {
              console.error(reason);
            });
        } else {
          this.logo = e.target?.result;
        }
      };
      reader.readAsDataURL(file);
    },
    removeImage: function (/** @type {Event} */ e) {
      this.$refs.logoUpload.value = null;
      this.logo = '';
    },
  },
}).mount('#app');
