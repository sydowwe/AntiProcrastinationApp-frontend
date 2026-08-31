import { ref } from 'vue'

export function useTemplateCompare() {
	const compareMode = ref(false)
	const compareSelection = ref<number[]>([])
	const compareDialog = ref(false)

	function toggleCompareSelection(templateId: number) {
		const idx = compareSelection.value.indexOf(templateId)
		if (idx >= 0) {
			compareSelection.value.splice(idx, 1)
		} else if (compareSelection.value.length < 2) {
			compareSelection.value.push(templateId)
		}
	}

	function openComparison() {
		if (compareSelection.value.length === 2) {
			compareDialog.value = true
		}
	}

	function exitCompareMode() {
		compareMode.value = false
		compareSelection.value = []
	}

	return { compareMode, compareSelection, compareDialog, toggleCompareSelection, openComparison, exitCompareMode }
}
