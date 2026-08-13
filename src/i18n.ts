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

/**
 * App locale code → BCP 47 tag, for the platform APIs (`Intl`, `Date#toLocaleDateString`) that do
 * not speak our uppercase two-letter codes.
 *
 * It lives here because this is the file that already enumerates the app's locales: adding a
 * language means touching `messages` and this map in the same edit. It replaces a
 * `locale === 'EN' ? 'en-GB' : 'sk-SK'` ternary inlined in a component, which rendered Slovak dates
 * to `AvailableLocales.CZ` users.
 *
 * `_common`'s `formatLocalized` is not the alternative it looks like — it hardcodes dayjs's `'sk'`
 * and so formats in Slovak whatever the user picked. See `migration-revision.md` §13.
 */
const LOCALE_TAGS: Record<string, string> = {
	SK: 'sk-SK',
	EN: 'en-GB',
	CZ: 'cs-CZ',
}

/** Falls back to the app's default locale rather than the browser's, so output stays predictable. */
export function localeTag(locale: string): string {
	return LOCALE_TAGS[locale.toUpperCase()] ?? LOCALE_TAGS.SK!
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
