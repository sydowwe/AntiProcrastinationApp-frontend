import { ref } from 'vue'

export function useCalendarModes() {
	const isBulkSelectMode = ref(false)
	const isEditDetailsMode = ref(false)
	const isApplyTemplateMode = ref(false)
	const selectedDayIds = ref<number[]>([])
	const applyTemplateId = ref<number | null>(null)
	const applyPreviewMode = ref(true)

	function toggleBulkSelectMode() {
		isBulkSelectMode.value = !isBulkSelectMode.value
		if (isBulkSelectMode.value) {
			isEditDetailsMode.value = false
			isApplyTemplateMode.value = false
			applyTemplateId.value = null
		} else {
			selectedDayIds.value = []
		}
	}

	function toggleEditDetailsMode() {
		isEditDetailsMode.value = !isEditDetailsMode.value
		if (isEditDetailsMode.value) {
			isBulkSelectMode.value = false
			isApplyTemplateMode.value = false
			selectedDayIds.value = []
			applyTemplateId.value = null
		}
	}

	function toggleApplyTemplateMode() {
		isApplyTemplateMode.value = !isApplyTemplateMode.value
		if (isApplyTemplateMode.value) {
			isBulkSelectMode.value = false
			isEditDetailsMode.value = false
			selectedDayIds.value = []
		} else {
			applyTemplateId.value = null
			applyPreviewMode.value = true
		}
	}

	function toggleDaySelection(calendarId: number) {
		const idx = selectedDayIds.value.indexOf(calendarId)
		if (idx >= 0) selectedDayIds.value.splice(idx, 1)
		else selectedDayIds.value.push(calendarId)
	}

	return {
		isBulkSelectMode,
		isEditDetailsMode,
		isApplyTemplateMode,
		selectedDayIds,
		applyTemplateId,
		applyPreviewMode,
		toggleBulkSelectMode,
		toggleEditDetailsMode,
		toggleApplyTemplateMode,
		toggleDaySelection,
	}
}
