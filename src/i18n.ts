import { createI18n } from 'vue-i18n'
import EN from './locales/EN.ts'
import SK from './locales/SK.ts'

// Slovak has three plural categories — 1 / 2–4 / 5+ (and 0 behaves like 5+). vue-i18n's built-in
// rule only knows two, so a count-bearing SK message would render "5 úlohy" instead of "5 úloh".
// Message forms are therefore ordered `one | few | many` in SK. Only messages resolved *with* a
// count argument go through this; every other string is untouched.
function slovakPluralRule(choice: number, choicesLength: number): number {
	if (choicesLength < 3) return choice === 1 ? 0 : 1
	if (choice === 1) return 0
	if (choice >= 2 && choice <= 4) return 1
	return 2
}

const i18n = createI18n({
	locale: 'SK',
	fallbackLocale: 'EN',
	pluralRules: {
		SK: slovakPluralRule,
	},
	messages: {
		SK,
		EN,
	},
})

export default i18n
