import { computed, ref } from 'vue'

export type CalendarMode = 'none' | 'bulkSelect' | 'editDetails' | 'applyTemplate'

export function useCalendarModes() {
	const mode = ref<CalendarMode>('none')
	const selectedDayIds = ref<number[]>([])
	const applyTemplateId = ref<number | null>(null)
	const applyPreviewMode = ref(true)

	const isBulkSelectMode = computed(() => mode.value === 'bulkSelect')
	const isEditDetailsMode = computed(() => mode.value === 'editDetails')
	const isApplyTemplateMode = computed(() => mode.value === 'applyTemplate')

	// Side effects are not symmetric between the three modes — read carefully before changing.
	function setMode(next: Exclude<CalendarMode, 'none'>) {
		const previous = mode.value
		if (previous === next) {
			mode.value = 'none'
			if (previous === 'bulkSelect') {
				selectedDayIds.value = []
			} else if (previous === 'applyTemplate') {
				applyTemplateId.value = null
				applyPreviewMode.value = true
			}
			return
		}

		mode.value = next
		if (next === 'bulkSelect') {
			applyTemplateId.value = null
		} else if (next === 'editDetails') {
			selectedDayIds.value = []
			applyTemplateId.value = null
		} else if (next === 'applyTemplate') {
			selectedDayIds.value = []
		}
	}

	function toggleBulkSelectMode() {
		setMode('bulkSelect')
	}

	function toggleEditDetailsMode() {
		setMode('editDetails')
	}

	function toggleApplyTemplateMode() {
		setMode('applyTemplate')
	}

	function toggleDaySelection(calendarId: number) {
		const idx = selectedDayIds.value.indexOf(calendarId)
		if (idx >= 0) selectedDayIds.value.splice(idx, 1)
		else selectedDayIds.value.push(calendarId)
	}

	return {
		mode,
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
