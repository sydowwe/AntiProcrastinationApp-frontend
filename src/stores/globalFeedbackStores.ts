import { defineStore } from 'pinia';

export interface ErrorSnackBarConfig {
  timeout?: number;
  closable?: boolean;
}
export interface SnackBarConfig extends ErrorSnackBarConfig {
  color?: string;
}

export const useSnackBarStore = defineStore({
  id: 'errorSnackBar',
  state: () => ({
    snackbar: false,
    color: 'green',
    message: 'ERROR',
    timeout: 5000,
    closable: false,
  }),
  actions: {
    showErrorSnackbar(customMessage: string, config?: ErrorSnackBarConfig) {
      this.snackbar = false;
      this.message = customMessage || 'Error';
      this.timeout = config?.timeout || this.timeout;
      this.closable = config?.closable || false;
      this.color = 'error';
      this.snackbar = true;
    },
    showSnackbar(customMessage?: string, config?: SnackBarConfig) {
      this.snackbar = false;
      this.message = customMessage || this.message;
      this.timeout = config?.timeout || this.timeout;
      this.color = config?.color || this.color;
      this.closable = config?.closable || true;
      this.snackbar = true;
    },
    hideSnackbar() {
      this.snackbar = false;
    },
  },
});

export const useFullScreenLoadingStore = defineStore({
  id: 'fullScreenLoading',
  state: () => ({
    loading: false,
  }),
  actions: {
    showFullScreenLoading() {
      this.loading = true;
    },
    hideFullScreenLoading() {
      this.loading = false;
    },
  },
});