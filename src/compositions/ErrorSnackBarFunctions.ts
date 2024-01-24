import { ref } from 'vue';

export interface ErrorSnackBarConfig {
  timeout?: number;
  closable?: boolean;
}
export interface ErrorSnackBarFunctions {
  showErrorSnackbar: (customMessage?: string, config?: ErrorSnackBarConfig) =>{};
  hideErrorSnackbar: () => {};
}


const showErrorSnackbar = (customMessage?: string, config?: ErrorSnackBarConfig) => {
  state.message.value = customMessage || 'ERROR';
  state.timeout.value = config?.timeout || 5000;
  state.closable.value = config?.closable !== undefined ? config.closable : true;
  state.snackbar.value = true;
};

const hideErrorSnackbar = () => {
  state.snackbar.value = false;
};

const state = {
  snackbar: ref(false),
  message: ref('ERROR'),
  timeout: ref(5000),
  closable: ref(false),
  showErrorSnackbar,
  hideErrorSnackbar,
};

export function useErrorSnackBar() {
  return {
    ...state
  };
}