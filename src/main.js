import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './plugins/router'
import vuetify from './plugins/vuetify'; 
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import 'vuedraggable/dist/vuedraggable.css';
import moment from 'moment';
import VueI18n from 'vue-i18n';
import VueMoment from 'vue-moment';
import VueRouterPermissions from 'vue-router-permissions';
import VueSelect from 'vue-select';
import VeeValidate from 'vee-validate';
import { FontAwesomeIcon } from 'font-awesome';

import { createI18n } from 'vue-i18n';

import en from './locales/en.json';
import sk from './locales/sk.json';
import cs from './locales/cs.json';

const i18n = createI18n({
  locale: 'en', 
  messages: {
    en,
    sk,
    cs,
  },
});
const app = createApp(App)

app.use(createPinia())
app.use(router);
app.use(vuetify);
app.use(i18n);
app.use(VueMoment, { moment });
app.use(VueRouterPermissions);
app.use(VueSelect);
app.use(VeeValidate);

app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app')