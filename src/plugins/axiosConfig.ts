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

let isRefreshing = false;
let failedQueue: Array<{resolve: (value?: unknown) => void, reject: (reason?: unknown) => void}> = [];

function processQueue(error: unknown, token: string | null = null) {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
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

		// Check for token expiration header
		if (response.headers['x-token-expired']) {
			const originalRequest = response.config;

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
				await API.post('/auth/refresh');
				processQueue(null);
				isRefreshing = false;
				return API(originalRequest);
			} catch (error) {
				processQueue(error, null);
				isRefreshing = false;
				const userStore = useUserStore();
				userStore.logout();
				router.push({name: 'login'});
				return Promise.reject(error);
			}
		}

		return Promise.resolve(response);
	},
	async (error) => {
		const {showErrorSnackbar} = useSnackbar();
		const userStore = useUserStore();

		const logoutClient = () => {
			userStore.logout();
			router.push({name: 'login'});
		};

		// Check for token expiration header in error response
		if (error.response?.headers['x-token-expired']) {
			const originalRequest = error.config;

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
				await API.post('/auth/refresh');
				processQueue(null);
				isRefreshing = false;
				return API(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				isRefreshing = false;
				logoutClient();
				return Promise.reject(refreshError);
			}
		}

		console.log(error)
		if (router.currentRoute.value.name !== 'login' && (error.response?.status === HttpStatusCode.Unauthorized)) {
			console.error('unauthorizedeeeeeeeee')
			showErrorSnackbar('Please log in before accessing the page', {closable: false});
			logoutClient();
		} else if ((error?.response?.status === HttpStatusCode.Forbidden)) {
			showErrorSnackbar('You dont have permission for that action', {closable: false});
		}
		console.error('ERROR: ', error);
		switch (error.status) {
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