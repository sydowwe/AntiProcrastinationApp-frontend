import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../plugins/stores/userStore';
import {useErrorSnackBar} from '../compositions/ErrorSnackBarFunctions';
import { useFullScreenLoading } from '../compositions/FullScreenLoadingFunctions';


export default function importDefaults(){
    const i18n = useI18n();
    const router = useRouter();
    const { showErrorSnackbar, hideErrorSnackbar } = useErrorSnackBar();
    const { showFullScreenLoading, hideFullScreenLoading } = useFullScreenLoading();
    const userStore = useUserStore();
    return {
        i18n,
        router,
        showErrorSnackbar,
        hideErrorSnackbar,
        userStore,
        showFullScreenLoading, 
        hideFullScreenLoading,
    }
}