import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { useSnackBarStore, useFullScreenLoadingStore } from '../stores/globalFeedbackStores'
export interface Field {
    name: string;
    label: string;
}

export function importDefaults(){
    const i18n = useI18n();
    const router = useRouter();
    const userStore = useUserStore();
    function goToLogin() {
        router.push({ name: 'login' });
    }
    const { showFullScreenLoading, hideFullScreenLoading} = useFullScreenLoadingStore();
    const { showErrorSnackbar, showSnackbar, hideSnackbar} = useSnackBarStore();
    return {
        i18n,
        goToLogin,
        router,
        userStore,
        showFullScreenLoading, hideFullScreenLoading,
        showErrorSnackbar, showSnackbar, hideSnackbar,
    }
}