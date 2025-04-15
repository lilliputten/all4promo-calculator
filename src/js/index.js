// Import statements
import '../scss/index.scss';
import { createApp } from 'vue/dist/vue.esm-bundler';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import axios from 'axios';
import html2canvas from 'html2canvas';
import dataJson from '../json/data.json';
import * as pdfjs from '../pdf.mjs';

// Create Vue app
const app = createApp({
  data() {
    return {
      preloaded: false,
      title: null,
      edition: null,
      logo: null,
      comment: null,
      data: null,
      date: new Date(),
    };
  },
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    const onSwiper = (_swiper) => {};
    return {
      onSwiper,
    };
  },
  async mounted() {
    this.data = dataJson;
    this.setList(0);
    setTimeout(() => {
      this.preloaded = true;
      let observerLogo = new MutationObserver((mutations) => {
        mutations.forEach((mutationRecord) => {
          let mutation = mutationRecord.target.getAttribute('style');
          this.$refs.logoElementBottom.setAttribute('style', mutation);
        });
      });

      const targetLogo = this.$refs.logoElement;
      observerLogo.observe(targetLogo, { attributes: true, attributeFilter: ['style'] });

      const dragElement = (elmnt) => {
        var pos1 = 0,
          pos2 = 0,
          pos3 = 0,
          pos4 = 0;
        const garabber = elmnt.querySelector('.element');
        if (document.getElementById(elmnt.id + 'header')) {
          document.getElementById(elmnt.id + 'header').onmousedown = dragMouseDown;
        } else {
          garabber.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
          e = e || window.event;
          e.preventDefault();
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
        }

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
    async setList(num) {
      this.data.types.forEach((el, index) => {
        this.data.types[index].selected = false;
      });
      this.data.types[num].selected = true;
      if (this.data.types[num]?.colors?.length) {
        this.data.types[num].colors.forEach((el, index) => {
          el.selected = !index;
        });
      }
      if (this.data.types[num]?.types?.length) {
        this.data.types[num].types.forEach((el) => {
          el.options.forEach((option, i) => {
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
        this.data.types.map(async (type) => {
          if (type.svg) {
            color = type.colors ? this.getSelected(type.colors)?.code : null;
            if (type.svgNew) {
              type.svgNew = this.changeColor(type.svgNew, color);
            } else {
              type.svgNew = await this.fetchSvg(type.svg, color);
            }
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
        }),
      );
    },
    setProp(arr, num, mainobj = null) {
      if (mainobj.checkbox) {
        arr[num].selected = !arr[num].selected;
      } else {
        arr.forEach((el, index) => {
          el.selected = num === index;
        });
      }
      if (mainobj?.colors) {
        const colorCode = this.getSelected(mainobj.colors)?.code;

        if (mainobj?.svgNew) {
          mainobj.svgNew = this.changeColor(mainobj.svgNew, colorCode);
        } else if (this.getSelected(mainobj.options).svgNew) {
          this.getSelected(mainobj.options).svgNew = this.changeColor(
            this.getSelected(mainobj.options).svgNew,
            colorCode,
          );
        }
      }
    },
    getSelected(arr) {
      return arr.find((el) => el.selected);
    },
    printHtml() {
      const cl = document.querySelector('#capture');
      document.querySelector('html').classList.add('prntbl');
      html2canvas(cl).then((canvas) => {
        const nWindow = window.open('');
        let style = document.createElement('style');
        style.innerHTML = 'canvas{width: 100%!important; height: auto!important;}';
        nWindow.document.head.appendChild(style);
        nWindow.document.body.appendChild(canvas);
        nWindow.focus();
        nWindow.print();
        document.querySelector('html').classList.remove('prntbl');
      });
    },
    fetchSvg(link, color = null) {
      return new Promise((resolve) => {
        axios.get(link).then((svg) => {
          resolve(this.changeColor(svg.data, color));
        });
      });
    },
    changeColor(svg, color) {
      return color ? svg.replace(/fill="[#,a-z,A-Z,0-9]+"/gm, `fill="${color}"`) : svg;
    },
    onFileChange(e) {
      let files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      this.createImage(files[0]);
    },
    createImage(file) {
      let reader = new FileReader();
      reader.onload = (e) => {
        this.logo = '';
        if (file.type === 'application/pdf') {
          pdfjs
            .getDocument(e.target.result)
            .promise.then((pdf) => {
              pdf.getPage(1).then((page) => {
                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport,
                };
                page.render(renderContext).promise.then(() => {
                  this.logo = canvas.toDataURL();
                });
              });
            })
            .catch((reason) => {
              console.error(reason);
            });
        } else {
          this.logo = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    },
    removeImage: function (e) {
      this.$refs.logoUpload.value = null;
      this.logo = '';
    },
  },
}).mount('#app');
