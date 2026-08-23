import type { ComputedRef } from 'vue'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'

export function useTaskBlockKeyboard(store: AnyDayPlannerStore, isSelected: ComputedRef<boolean>) {
	function handleEnterKey(e: KeyboardEvent): void {
		e.preventDefault()
		if (isSelected.value && store.selectedTaskIds.size === 1) {
			store.openEditDialog()
		}
	}

	function handleEKey(e: KeyboardEvent): void {
		e.preventDefault()
		if (isSelected.value && store.selectedTaskIds.size === 1) {
			store.openEditDialog()
		}
	}

	function handleDeleteKey(e: KeyboardEvent): void {
		e.preventDefault()
		store.openDeleteDialog()
	}

	function handleEscapeKey(e: KeyboardEvent): void {
		e.preventDefault()
		store.clearSelection()
		;(e.target as HTMLElement).blur()
	}

	function handleDuplicateKey(): void {
		if (isSelected.value && store.selectedTaskIds.size >= 1) {
			store.startDuplicate()
		}
	}

	return { handleEnterKey, handleEKey, handleDeleteKey, handleEscapeKey, handleDuplicateKey }
}
