import { ref, watch } from 'vue'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'

export function usePlannerClipboardPreview(store: AnyDayPlannerStore) {
	const previewTaskIds = ref<Set<number>>(new Set())

	function addPreviewTasksToGrid(): void {
		if (!store.pendingClipboard || previewTaskIds.value.size > 0) return
		const { tasks: clipTasks, mode } = store.pendingClipboard
		const ids = new Set<number>()
		for (const t of clipTasks) {
			const previewId = mode === 'cut' ? t.id : -t.id
			const copy = { ...t, id: previewId, gridRowStart: 1, gridRowEnd: 1 }
			store.tasks.push(copy)
			ids.add(previewId)
		}
		previewTaskIds.value = ids
		store.clipboardPreviewTaskIds = new Set(ids)
	}

	function removePreviewTasksFromGrid(): void {
		if (previewTaskIds.value.size === 0) return
		store.tasks = store.tasks.filter(t => !previewTaskIds.value.has(t.id))
		previewTaskIds.value = new Set()
		store.clipboardPreviewTaskIds = new Set()
		store.clipboardConflict = false
	}

	watch(
		() => store.pendingClipboard,
		val => {
			if (!val) removePreviewTasksFromGrid()
		},
	)

	return { previewTaskIds, addPreviewTasksToGrid, removePreviewTasksFromGrid }
}
