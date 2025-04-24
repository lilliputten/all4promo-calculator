type ToastType = 'error' | 'info' | 'success';

interface ToastParams {
  type?: ToastType;
  title?: string;
  body?: string;
}
