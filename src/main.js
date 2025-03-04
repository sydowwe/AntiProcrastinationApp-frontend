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
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    responseType: 'json',
});
import {importDefaults} from "@/compositions/general/Defaults";

const {userStore, showErrorSnackbar, hideFullScreenLoading, axiosSuccessLoadingHide} = importDefaults();
const logoutClient = () => {
    userStore.logout();
    router.push({name: 'login'});
};
axiosInstance.interceptors.response.use(
    (response) => {
        if (axiosSuccessLoadingHide) {
            console.log('axios instance')
            hideFullScreenLoading();
        }
        return Promise.resolve(response);
    },
    (error) => {
        if (router.currentRoute.value.name !== 'login' && (error.response.status === HttpStatusCode.Unauthorized)) {
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
import vue3GoogleSignIn from 'vue3-google-signin'

app.use(vue3GoogleSignIn, {
    clientId: '579844911566-f19mdo9mvm9nj2v4f6nnrq9j3r3ccr6t.apps.googleusercontent.com'
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
import {VAutocomplete, VSelect,VBtn} from "vuetify/components";

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
    aliases: {
        VIdSelect: VSelect,
        VIdAutocomplete: VAutocomplete,
        VIconBtn: VBtn,
    },
    defaults: {
        VCardActions: {
            VBtn: {variant: 'elevated'},
        },
        VBtn: {variant: 'elevated'},
        VTextField: {variant: 'outlined', clearable: true, density: 'comfortable'},
        VIdAutocomplete: {variant: 'outlined', clearable: true, density: 'comfortable', itemValue: 'id', itemTitle: 'text'},
        VAutocomplete: {variant: 'outlined', density: 'comfortable'},

        VIdSelect: {variant: 'outlined', clearable: true, density: 'comfortable', itemValue: 'id', itemTitle: 'text'},
        VSelect: {variant: 'outlined', density: 'comfortable'},
        VTextarea: {variant: 'outlined', clearable: true, density: 'comfortable'},
        VCheckbox: {density: 'comfortable'},
        VIconBtn: {rounded: '', density: 'comfortable'}
    },
    theme: {
        defaultTheme: 'dark',
        theme: 'dark',
        themes: {
            dark: {
                dark: true,
                variables: {
                    'theme-on-info': '#FFFFFF',    // Text on info background
                    'theme-on-warning': '#FFFFFF', // Text on warning background
                },
                colors: {
                    primary: '#5b42fc',
                    secondary: '#424242',

                    info: '#82B1FF',
                    error: '#FF5252',
                    main: '#3c9eec',
                    success: '#4CAF50',
                    warning: '#E6AC00',
                },
            },
        }
    },

})
app.use(vuetify);


import {VueRecaptchaPlugin} from 'vue-recaptcha/head'

app.use(VueRecaptchaPlugin, {
    v3SiteKey: '6Lc3gGAqAAAAADLW781ijxUKApckEpT7bLmRlCRk'
})

app.mount('#app');