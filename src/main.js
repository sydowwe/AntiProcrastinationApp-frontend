import './assets/main.css'

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import moment from 'moment';

import './plugins/vuetify';
import router from './plugins/router';
import App from './App.vue';

import axios from 'axios';
window.axios = axios.create({
    baseURL: 'http://localhost:8080', 
});

import sortable from 'sortable';
import { VueDraggableNext } from 'vue-draggable-next';
import { createI18n } from 'vue-i18n';

const app = createApp(App);

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'

import { vuetify } from './plugins/vuetify';
import '../node_modules/vuetify/dist/vuetify.css'

library.add(faUserSecret)

// import './plugins/veeValidate'
// Import your language files
// import en from './locales/en.json';
// import sk from './locales/sk.json';
// import cz from './locales/cz.json';



app.use(createPinia());

app.use(router);

app.use(vuetify);


app.use(moment);


app.component(VueDraggableNext);

app.component('font-awesome-icon', FontAwesomeIcon);


// Create and use VueI18n instance for localization
// const i18n = createI18n({
//   locale: 'en',
//   messages: {
//     en,
//     sk,
//     cs,
//   },
// });
// app.use(i18n);


app.mount('#app');