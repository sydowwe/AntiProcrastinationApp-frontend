import './assets/main.css'
import { createApp } from 'vue';
import App from './App.vue';
const app = createApp(App);

// PINIA
import { createPinia } from 'pinia';
app.use(createPinia());



//IDK
import moment from 'moment';
import sortable from 'sortable';
import { VueDraggableNext } from 'vue-draggable-next';
app.use(moment);
app.component(VueDraggableNext);

// ROUTER
import router from './plugins/router';
app.use(router);

// AXIOS
import axios from 'axios';
import { useUserStore } from './plugins/stores/user';
const authStore = useUserStore();
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',  
});
axiosInstance.interceptors.request.use((config) => {
    if(authStore.getToken){
        config.headers.Authorization = `Bearer ${authStore.getToken}`;
    }
    return config;
  });
window.axios = axiosInstance;


// I18N INTERNATIONALIZATION
import { createI18n, useI18n } from 'vue-i18n'
import en from './locales/en';
import sk from './locales/sk';
import cz from './locales/cz';

const i18n = createI18n({
    legacy: false,
    locale: 'sk',
    fallbackLocale: 'en',
    messages: {
        en,
        sk,
        cz,
    },
});
app.use(i18n);

// VEEVALIDATE
// import './plugins/veeValidate'

// FONT-AWESOME
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUserSecret, faPlus, faEye, faEyeSlash,fas } from '@fortawesome/free-solid-svg-icons'
library.add(fas);
app.component('FontAwesomeIcon', FontAwesomeIcon);

// VUETIFY
import '../node_modules/vuetify/dist/vuetify.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { aliases, mdi } from 'vuetify/lib/iconsets/mdi-svg.mjs'


export const vuetify = createVuetify({
    locale: {
        adapter: createVueI18nAdapter({ i18n, useI18n }),
    },
    components,
    directives,
    icons: {
        iconfont: 'faSvg',
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    aliases:{
    },
    defaults: {
        VCardActions: {
            VBtn: { variant: 'elevated' },
        },
        VBtn: { variant: 'elevated' },
        VTextField: { variant: 'outlined', clearable: true, density: 'comfortable' },
        VAutocomplete: { variant: 'outlined', clearable: true, density: 'comfortable', itemValue: 'id', itemTitle: 'label' },
        VSelect: { variant: 'outlined', clearable: true, density: 'comfortable' },
        VTextarea: { variant: 'outlined', clearable: true, density: 'comfortable' },
        VCheckbox: { density: 'comfortable' },

    },
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                primary: '#1976D2',
                secondary: '#424242',
                accent: '#82B1FF',
                error: '#FF5252',
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FFC107',
            },
        },
    }
})
app.use(vuetify);


app.mount('#app');