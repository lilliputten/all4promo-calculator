/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="@vue/runtime-dom" />

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.yaml' {
  const data: any;
  export default data;
}

declare module '*.scss';

declare module 'vue/dist/vue.esm-bundler' {
  export const createApp: import('vue').CreateAppFunction<Element>;
}
