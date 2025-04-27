declare global {
  interface Window {
    LOCAL?: boolean;
    DEBUG?: boolean;
    globalApp: ComponentPublicInstance;
  }
}

export {};
