import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'

// One boolean used to govern five deletes with wildly different blast radii: deleting a planner
// entry (one task, one day, undoable) went through the same `if (askBeforeDelete)` as deleting a
// to-do list and every item in it. A user who switched the preference off to stop being nagged
// about single entries also switched it off for "delete this list and its 14 items".
//
// So the decision is made on the CONSEQUENCE of the delete, and the preference only gets a vote
// where the consequence is small. `prompts/user/P3-delete-confirmation-granularity.md` owns this.

export interface DeleteConsequence {
	/** The delete takes children with it — other rows the user did not name disappear too. */
	cascades: boolean
	/** The caller pushes an undo entry onto `useUndoStack()` after deleting. Do not claim this loosely. */
	undoable: boolean
}

export type DeleteDecision =
	/** Show a confirmation dialog. For a cascade it must state how many children go with it. */
	| 'confirm'
	/** Delete now; the caller MUST push its undo entry, which is the whole safety net here. */
	| 'undoable'
	/** Delete now, with nothing to fall back on. Only reached for a leaf the user opted out of confirming. */
	| 'immediate'

export function useDeleteConfirmation() {
	const { askBeforeDelete } = useUserPreferences()

	/**
	 * A cascade always confirms, whatever the preference says. A user cannot meaningfully consent to
	 * a number they were never shown, and no settings toggle should be able to switch that off — it
	 * is the one place the preference is overruled.
	 */
	function resolveDelete({ cascades, undoable }: DeleteConsequence): DeleteDecision {
		if (cascades) return 'confirm'
		if (askBeforeDelete.value) return 'confirm'
		return undoable ? 'undoable' : 'immediate'
	}

	function shouldConfirm(consequence: DeleteConsequence): boolean {
		return resolveDelete(consequence) === 'confirm'
	}

	return { resolveDelete, shouldConfirm }
}
