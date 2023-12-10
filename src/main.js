import './assets/main.css'
import { createApp } from 'vue';
import App from './App.vue';
const app = createApp(App);

// PINIA
import { createPinia } from 'pinia';
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
library.add(fas)
library.add(far)
app.component('FontAwesomeIcon', FontAwesomeIcon);

// VUETIFY
import '../node_modules/vuetify/dist/vuetify.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


import { aliases, fa } from 'vuetify/lib/iconsets/fa-svg.mjs'

export const vuetify = createVuetify({
    locale: {
        adapter: createVueI18nAdapter({ i18n, useI18n }),
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
        theme:'dark',
        themes: {
            dark: {
                primary: '#5b42fc',
                secondary: '#424242',
                accent: '#82B1FF',
                error: '#FF5252',
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#ffe554',
            },
        },
    }
})
app.use(vuetify);


app.mount('#app');