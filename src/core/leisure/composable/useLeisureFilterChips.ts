import { useI18n } from 'vue-i18n'

// The four leisure filter panels share three chip shapes. These factories return
// ChipFormatter-compatible functions (untyped against T so they stay assignable to any
// ChipFormatters<T> without needing generics per call site — see FilterPanel.vue's ChipInfo).
export function useLeisureFilterChips() {
	const { t } = useI18n()

	function textChip(labelKey: string, icon: string) {
		return (value: string | number | null | undefined) =>
			value != null && value !== '' ? { label: `${t(labelKey)}: ${value}`, icon } : null
	}

	function countChip(labelKey: string, icon: string) {
		return (value: unknown[] | null | undefined) =>
			value?.length ? { label: `${t(labelKey)} (${value.length})`, icon } : null
	}

	function boolChip(labelKey: string, trueIcon: string, falseIcon: string = trueIcon) {
		return (value: boolean | null | undefined) => {
			if (value == null) return null
			return { label: `${t(labelKey)}: ${value ? '✓' : '✗'}`, icon: value ? trueIcon : falseIcon }
		}
	}

	return { textChip, countChip, boolChip }
}
