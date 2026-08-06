import { createI18n } from 'vue-i18n'
import EN from './locales/EN.ts'
import SK from './locales/SK.ts'

const i18n = createI18n({
	locale: 'SK',
	fallbackLocale: 'EN',
	messages: {
		SK,
		EN,
	},
})

export default i18n
