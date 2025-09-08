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

API.interceptors.response.use(
	(response) => {
		const {hideFullScreenLoading, axiosSuccessLoadingHide} = useLoading();
		if (axiosSuccessLoadingHide) {
			hideFullScreenLoading();
		}
		return Promise.resolve(response);
	},
	(error) => {
		const {showErrorSnackbar} = useSnackbar();
		const userStore = useUserStore();

		const logoutClient = () => {
			userStore.logout();
			router.push({name: 'login'});
		};

		console.log('test')
		if (router.currentRoute.value.name !== 'login' && (error.response?.status === HttpStatusCode.Unauthorized)) {
			console.log('unauthorizedeeeeeeeee')
			showErrorSnackbar('Please log in before accessing the page', {closable: false});
			logoutClient();
		} else if ((error.response.status === HttpStatusCode.Forbidden)) {
			showErrorSnackbar('You dont have permission for that action', {closable: false});
		}
		console.log('error: ', error);
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