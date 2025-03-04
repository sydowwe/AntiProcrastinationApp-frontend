import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useSnackBarStore, useLoadingStore } from '@/stores/globalFeedbackStores'
export interface Field {
    name: string;
    label: string;
}

export function importDefaults(){
    const router = useRouter();
    const userStore = useUserStore();
    async function goToLogin() {
        await router.push({ name: 'login' });
    }
    const { showFullScreenLoading, hideFullScreenLoading, axiosSuccessLoadingHide} = useLoadingStore();
    const { showErrorSnackbar, showSuccessSnackbar, showSnackbar, hideSnackbar} = useSnackBarStore();
    return {
        goToLogin,
        router,
        userStore,
        showFullScreenLoading, hideFullScreenLoading, axiosSuccessLoadingHide,
        showErrorSnackbar, showSuccessSnackbar, showSnackbar, hideSnackbar,
    }
}