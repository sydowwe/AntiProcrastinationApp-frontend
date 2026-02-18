import axios, {HttpStatusCode} from 'axios';
import router from '@/plugins/router';
import {useLoading} from '@/composables/general/LoadingComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useUserStore} from '@/stores/userStore.ts';

export const API = axios.create({
	baseURL: import.meta.env.VITE_API_URL + '/api',
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	},
	responseType: 'json',
});

// Separate instance for refresh to avoid interceptor loops
const refreshClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL + '/api',
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	},
	withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{resolve: (value?: unknown) => void, reject: (reason?: unknown) => void}> = [];

function processQueue(error: unknown) {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve();
		}
	});
	failedQueue = [];
}

API.interceptors.response.use(
	async (response) => {
		const {hideFullScreenLoading, axiosSuccessLoadingHide} = useLoading();
		if (axiosSuccessLoadingHide) {
			hideFullScreenLoading();
		}

		// Proactively refresh token if server signals expiration
		if (response.headers['x-token-expired'] && !isRefreshing) {
			isRefreshing = true;
			try {
				await refreshClient.post('/auth/refresh');
			} catch {
				// Silent fail — the next request will handle it via the error interceptor
			} finally {
				isRefreshing = false;
			}
		}

		return response;
	},
	async (error) => {
		const {showErrorSnackbar} = useSnackbar();
		const userStore = useUserStore();
		const originalRequest = error.config;

		function logoutClient() {
			userStore.logout();
			router.push({name: 'login'});
		}

		const needsRefresh = error.response?.status === HttpStatusCode.Unauthorized
			|| error.response?.headers['x-token-expired'];

		if (needsRefresh && !originalRequest._retry && router.currentRoute.value.name !== 'login') {
			originalRequest._retry = true;

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({resolve, reject});
				}).then(() => {
					return API(originalRequest);
				}).catch(err => {
					return Promise.reject(err);
				});
			}

			isRefreshing = true;

			try {
				await refreshClient.post('/auth/refresh');
				processQueue(null);
				return API(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError);
				logoutClient();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		if (error.response?.status === HttpStatusCode.Forbidden) {
			showErrorSnackbar('You dont have permission for that action', {closable: false});
		}

		console.error('ERROR: ', error);
		switch (error.response?.status) {
			case 409:
				showErrorSnackbar('Conflict');
				break;
			default:
				break;
		}
		return Promise.reject(error);
	}
);

API.defaults.headers.common = {
	"Content-Type": "application/json"
}
API.defaults.withCredentials = true;