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
    function goToLogin() {
        router.push({ name: 'login' });
    }
    const { showFullScreenLoading, hideFullScreenLoading} = useLoadingStore();
    const { showErrorSnackbar, showSnackbar, hideSnackbar} = useSnackBarStore();
    return {
        goToLogin,
        router,
        userStore,
        showFullScreenLoading, hideFullScreenLoading,
        showErrorSnackbar, showSnackbar, hideSnackbar,
    }
}