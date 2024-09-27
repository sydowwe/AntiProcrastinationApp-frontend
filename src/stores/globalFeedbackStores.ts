import {defineStore} from 'pinia';

export interface ErrorSnackBarConfig {
	timeout?: number;
	closable?: boolean;
	dontHideFullScreenLoading?: boolean;
}

export interface SnackBarConfig extends ErrorSnackBarConfig {
	color?: string;
}

export const useSnackBarStore = defineStore({
	id: 'snackBar',
	state: () => ({
		snackbar: false,
		color: 'primary',
		message: 'Done',
		timeout: 5000,
		closable: false,
	}),
	actions: {
		showErrorSnackbar(customMessage: string, config?: ErrorSnackBarConfig) {
			if (!config?.dontHideFullScreenLoading) {
				useLoadingStore().hideFullScreenLoading();
			}
			this.snackbar = false;
			this.message = customMessage || 'Error';
			this.timeout = config?.timeout || this.timeout;
			this.closable = config?.closable || false;
			this.color = 'error';
			this.snackbar = true;
		},
		showSuccessSnackbar(customMessage: string, config?: ErrorSnackBarConfig) {
			if (!config?.dontHideFullScreenLoading) {
				useLoadingStore().hideFullScreenLoading();
			}
			this.snackbar = false;
			this.message = customMessage || 'Success';
			this.timeout = config?.timeout || this.timeout;
			this.closable = config?.closable || true;
			this.color = 'success';
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

export const useLoadingStore = defineStore({
	id: 'loading',
	state: () => ({
		fullScreenLoading: false,
		axiosSuccessLoadingHide: true
	}),
	actions: {
		showFullScreenLoading() {
			if (!this.fullScreenLoading) {
				this.fullScreenLoading = true;
			}
		},
		hideFullScreenLoading() {
			// console.log('hide');
			this.fullScreenLoading = false;
			this.axiosSuccessLoadingHide = true;
		},
	},
});