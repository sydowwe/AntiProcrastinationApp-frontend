import {createApp} from 'vue';
import App from './App.vue';
// PINIA
import {createPinia} from 'pinia';
// ROUTER
import router from './plugins/router.js';
// AXIOS
// I18N INTERNATIONALIZATION
import {createI18n, useI18n} from 'vue-i18n'
import EN from './locales/EN';
import SK from './locales/SK';
// FONT-AWESOME
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {library} from '@fortawesome/fontawesome-svg-core'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
// VUETIFY
import '../node_modules/vuetify/dist/vuetify.css'
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import {VAutocomplete, VBtn, VSelect} from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {createVueI18nAdapter} from "vuetify/locale/adapters/vue-i18n";

import {aliases, fa} from 'vuetify/lib/iconsets/fa-svg'
import './assets/main.css'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App);


const pinia = createPinia();
pinia.use((context) => {
	const storeId = context.store.$id;
	console.log(storeId)
	const fromStorage = storeId === 'user' ? JSON.parse(window.localStorage.getItem(storeId) ?? '{}')
		: JSON.parse(window.sessionStorage.getItem(storeId) ?? '{}');

	if (fromStorage) {
		context.store.$patch(fromStorage);
	}

	context.store.$subscribe((mutation, state) => {
		storeId === 'user' ? window.localStorage.setItem(storeId, JSON.stringify(state))
			: window.sessionStorage.setItem(storeId, JSON.stringify(state));
	});
});
pinia.use(async context => {
	if (context.store.ensureLoaded) {
		await context.store.ensureLoaded();
	}
});
app.use(pinia);


app.use(router);

const i18n = createI18n({
	locale: 'SK',
	fallbackLocale: 'EN',
	messages: {
		SK,
		EN
	},
});
app.use(i18n);

library.add(fas)
library.add(far)
library.add(fab)
app.component('FontAwesomeIcon', FontAwesomeIcon);

export const vuetify = createVuetify({
	locale: {
		adapter: createVueI18nAdapter({i18n: i18n as any, useI18n}),
	},
	components,
	directives,
	icons: {
		defaultSet: 'fa',
		aliases,
		sets: {
			fa
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
		VNumberInput: {variant: 'outlined', density: 'comfortable'},
		VDateInput: {variant: 'outlined', density: 'comfortable', prependIcon: "", prependInnerIcon: "calendar"},


		VIdSelect: {variant: 'outlined', clearable: true, density: 'comfortable', itemValue: 'id', itemTitle: 'text'},
		VSelect: {variant: 'outlined', density: 'comfortable'},
		VTextarea: {variant: 'outlined', clearable: true, density: 'comfortable'},
		VMaskInput: {variant: 'outlined', clearable: true, density: 'comfortable'},
		VCheckbox: {density: 'comfortable'},
		VIconBtn: {rounded: '', density: 'comfortable'}
	},
	theme: {
		defaultTheme: 'dark',
		themes: {
			dark: {
				dark: true,
				colors: {
					// Surface
					background: '#121212',
					surface: '#191920',
					'on-background': '#E5E7EB',
					'on-surface': '#FFF',

					// brand
					primary: '#1D4ED8', // blue-700
					secondary: '#6D28D9', // purple-700
					primaryOutline: '#60A5FA',
					secondaryOutline: '#A78BFA',

					// functional
					errorDark: '#DC2626', // red-600
					successDark: '#059669', // emerald-600
					warningDark: '#CA8A04', // yellow-600
					//info: '#0369A1', // sky-700
					// infoOutline: '#38BDF8',
					error: '#F87171',  // red-400 vs surface ≈ 4.8–4.9:1
					success: '#34D399',  // emerald-400 ≈ ~5:1
					warning: '#FACC15',  // darkyellow-400

					// accents for tinted surfaces (not buttons)
					// use deeper tones (800–900) or transparent tints over surface
					'primary-accent': '#1E40AF', // blue-800
					'secondary-accent': '#4C1D95', // purple-800
					'primary-container': '#1B2A44', // subtle blue-tinted surface
					'secondary-container': '#2A1F46', // subtle purple-tinted surface


					'on-primary-accent': '#FFFFFF',
					'on-secondary-accent': '#FFFFFF',
					'on-primary-container': '#FFFFFF',
					'on-secondary-container': '#FFFFFF',

					// Neutral scale (dark enough variants safe with white text)
					'neutral-50': '#0B1220',
					'neutral-100': '#111827',
					'neutral-200': '#1F2937',
					'neutral-300': '#374151',
					'neutral-400': '#4B5563',
					'neutral-500': '#6B7280',
					'neutral-600': '#9CA3AF',
					'neutral-700': '#D1D5DB',
					'neutral-800': '#E5E7EB',
					'neutral-900': '#F3F4F6',
				},
				variables: {
					'border-color': '#000000',
				},
			},
			light: {
				dark: false,
				colors: {
					background: '#CCC',
					surface: '#EEE',
					'on-background': '#111827',
					'on-surface': '#1F2937',

					primary: '#2563EB',
					secondary: '#7C3AED',
					primaryOutline: '#1D4ED8',
					secondaryOutline: '#6D28D9',

					'primary-accent': '#1E40AF', // blue-800
					'secondary-accent': '#4C1D95', // purple-800
					'primary-container': '#1B2A44', // subtle blue-tinted surface
					'secondary-container': '#2A1F46',

					error: '#DC2626',
					success: '#059669',
					warning: '#D97706',
					info: '#0284C7',

					'neutral-50': '#F9FAFB',
					'neutral-100': '#F3F4F6',
					'neutral-200': '#E5E7EB',
					'neutral-300': '#D1D5DB',
					'neutral-400': '#9CA3AF',
					'neutral-500': '#6B7280',
					'neutral-600': '#4B5563',
					'neutral-700': '#374151',
					'neutral-800': '#1F2937',
					'neutral-900': '#111827',
				},
			},
		},
	},
})
app.use(vuetify);

app.use(vue3GoogleLogin, {
	clientId: import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID
})

app.mount('#app');