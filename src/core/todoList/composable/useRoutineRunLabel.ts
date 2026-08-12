import { useI18n } from 'vue-i18n'

/**
 * A routine's streak is counted in periods, but "3 periods in a row" reads badly when the period
 * happens to be a day or a week. Pick the natural unit from the period length and let vue-i18n
 * pluralise it — SK needs three forms (1 / 2–4 / 5+), supplied by `slovakPluralRule` in `src/i18n.ts`,
 * so every message below is written `one | few | many` in SK and `one | other` in EN.
 */
export function useRoutineRunLabel() {
	const { t } = useI18n()

	/** "12 days in a row" — the accumulated run itself. */
	function runLabel(count: number, lengthInDays: number): string {
		return t(`routineTodoList.run${unitSuffix(lengthInDays)}`, { count }, count)
	}

	/** "12 days" — the same unit without the run phrasing, for use inside a longer sentence. */
	function countLabel(count: number, lengthInDays: number): string {
		return t(`routineTodoList.unit${unitSuffix(lengthInDays)}`, { count }, count)
	}

	return { runLabel, countLabel }
}

function unitSuffix(lengthInDays: number): string {
	if (lengthInDays === 1) return 'Days'
	if (lengthInDays === 7) return 'Weeks'
	if (lengthInDays >= 28 && lengthInDays <= 31) return 'Months'
	return 'Periods'
}
