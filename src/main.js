import './assets/main.css'
import {createApp} from 'vue';
import App from './App.vue';

const app = createApp(App);

// PINIA
import {createPinia} from 'pinia';

const pinia = createPinia();
pinia.use((context) => {
    const storeId = context.store.$id;
    const fromStorage = JSON.parse(window.sessionStorage.getItem(storeId));

    if (fromStorage) {
        context.store.$patch(fromStorage);
    }

    context.store.$subscribe((mutation, state) => {
        window.sessionStorage.setItem(storeId, JSON.stringify(state));
    });
});
app.use(pinia);


//IDK


// import { VueDraggableNext } from 'vue-draggable-next';
// app.component(VueDraggableNext);

// ROUTER
import router from './plugins/router';

app.use(router);

// AXIOS
import axios, {HttpStatusCode} from 'axios';


const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    responseType: 'json',
});
import {importDefaults} from "@/compositions/Defaults";
const { userStore, showErrorSnackbar, hideFullScreenLoading, axiosSuccessLoadingHide } = importDefaults();
const logoutClient = () => {
    userStore.logout();
    router.push({ name: 'login' });
};
axiosInstance.interceptors.response.use(
    (response) => {
        if (axiosSuccessLoadingHide) {
            console.log('hideeeer')
            hideFullScreenLoading();
        }
        return Promise.resolve(response);
    },
    (error) => {
        if (router.currentRoute.value.name !== 'login' && (error.response.status === HttpStatusCode.Unauthorized)) {
            showErrorSnackbar('Please log in before accessing the page', { closable: false });
            logoutClient();
        }else if((error.response.status === HttpStatusCode.Forbidden)){
            showErrorSnackbar('You dont have permission for that action', { closable: false });
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
axiosInstance.defaults.headers.common = {
    "Content-Type": "application/json"
}
axiosInstance.defaults.withCredentials = true;

window.axios = axiosInstance;


// I18N INTERNATIONALIZATION
import {createI18n, useI18n} from 'vue-i18n'
import EN from './locales/EN';
import SK from './locales/SK';
import CZ from './locales/CZ';

const i18n = createI18n({
    legacy: false,
    locale: 'EN',
    fallbackLocale: 'EN',
    messages: {
        EN,
        SK,
        CZ,
    },
});
app.use(i18n);

// VEEVALIDATE
// import './plugins/veeValidate'

//Google sign in
import vue3GoogleLogin from 'vue3-google-login'

app.use(vue3GoogleLogin, {
    clientId: '579844911566-n3ch6nfdlpmjfe00u5ueomkk3vfe3g4e.apps.googleusercontent.com'
})

// FONT-AWESOME
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {library} from '@fortawesome/fontawesome-svg-core'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'

library.add(fas)
library.add(far)
library.add(fab)
app.component('FontAwesomeIcon', FontAwesomeIcon);

// VUETIFY
import '../node_modules/vuetify/dist/vuetify.css'
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import {createVueI18nAdapter} from 'vuetify/locale/adapters/vue-i18n'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {aliases, fa} from 'vuetify/lib/iconsets/fa-svg.mjs'

export const vuetify = createVuetify({
    locale: {
        adapter: createVueI18nAdapter({i18n, useI18n}),
    },
    components,
    directives,
    icons: {
        defaultSet: 'fa',
        aliases,
        sets: {
            fa,
        },
    },
    aliases: {},
    defaults: {
        VCardActions: {
            VBtn: {variant: 'elevated'},
        },
        VBtn: {variant: 'elevated'},
        VTextField: {variant: 'outlined', clearable: true, density: 'comfortable'},
        VAutocomplete: {variant: 'outlined', clearable: true, density: 'comfortable', itemValue: 'id', itemTitle: 'label'},
        VSelect: {variant: 'outlined', clearable: true, density: 'comfortable'},
        VTextarea: {variant: 'outlined', clearable: true, density: 'comfortable'},
        VCheckbox: {density: 'comfortable'},

    },
    theme: {
        defaultTheme: 'dark',
        theme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors:{
                    primary: '#5b42fc',
                    secondary: '#424242',

                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#3c9eec',
                    success: '#4CAF50',
                    warning: '#FFC400',

                }
            },
        }
        },
})
app.use(vuetify);


import {VueRecaptchaPlugin} from 'vue-recaptcha/head'
app.use(VueRecaptchaPlugin, {
    v2SiteKey: '6Lfl3L8pAAAAAM25iDjXyjOOSISv5kqozSWPKwrN',
    v3SiteKey: '6LcoxRQqAAAAANQStle4t7x0RxaxiDQI2FBQRVnw',
})

app.mount('#app');