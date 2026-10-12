import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import type { RescheduleOverdueResult } from '@/core/todoList/dto/response/RescheduleOverdueResult.ts'
import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
import { startOfUserDayPlus } from '@/core/todoList/composable/todayBoundary.ts'
import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
import type { DueFilter } from '@/core/todoList/composable/useTodoListFilters.ts'

/** Below this a stale date or two is just a stale date; a pile is what people stop opening. */
export const RENEGOTIATE_THRESHOLD = 3

export function useOverdueRenegotiation(
	items: Ref<TodoListItemEntity[]>,
	filterDueState: Ref<DueFilter>,
	deps: {
		update: (id: number, request: ToDoListItemRequest) => Promise<unknown>
		fetchAll: () => Promise<TodoListItemEntity[]>
		rescheduleOverdue: (days: number) => Promise<RescheduleOverdueResult>
		undoRescheduleOverdue: (undoToken: string) => Promise<void>
	},
) {
	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { pushBulkRescheduleUndo } = useTodoListUndo()

	const isRenegotiating = ref(false)

	const overdueItems = computed(() => {
		// Local midnight of the *user's* today: "which day is it now" is an instant read, while
		// `item.dueDate + 'T00:00:00'` is a calendar day — both end up as browser-local-field Dates,
		// so they compare directly.
		const today = startOfUserDayPlus(0)
		return items.value.filter(item => !item.isDone && item.dueDate && new Date(item.dueDate + 'T00:00:00') < today)
	})

	/**
	 * Moves every past-due item to today (`days = 0`) or a week out (`days = 7`), in one request. Both
	 * are measured from the user's today rather than from each item's own date, so the pile actually
	 * clears instead of shifting a month-old task to three weeks old. The server chooses the items and
	 * the date (FO3), and records each move as a postponement.
	 *
	 * The undo goes through the server's undo token, which puts back the dates of exactly the items the
	 * server moved **and** the postponements it recorded, so an undone renegotiation never nudges an item
	 * toward the stuck-item offer. Against an API that returns no token it falls back to re-sending each
	 * item's old date, which restores the dates only.
	 */
	async function rescheduleOverdue(days: number) {
		if (overdueItems.value.length === 0) return
		const previous = new Map(overdueItems.value.map(item => [item.id, ToDoListItemRequest.fromEntity(item)]))
		isRenegotiating.value = true
		try {
			const { movedIds, undoToken } = await deps.rescheduleOverdue(days)
			const restorable = movedIds.flatMap(id => {
				const request = previous.get(id)
				return request ? [{ id, request }] : []
			})
			showSuccessSnackbar(
				i18n.t(
					days === 0 ? 'toDoList.renegotiate.movedToToday' : 'toDoList.renegotiate.movedByWeek',
					{ count: movedIds.length },
					movedIds.length,
				),
			)
			if (restorable.length > 0) {
				pushBulkRescheduleUndo(restorable.length, async () => {
					if (undoToken != null) await deps.undoRescheduleOverdue(undoToken)
					else await Promise.all(restorable.map(({ id, request }) => deps.update(id, request)))
					items.value = await deps.fetchAll()
				})
			}
		} finally {
			items.value = await deps.fetchAll()
			isRenegotiating.value = false
		}
	}

	function reviewOverdueOneByOne() {
		filterDueState.value = 'overdue'
	}

	return { RENEGOTIATE_THRESHOLD, overdueItems, isRenegotiating, rescheduleOverdue, reviewOverdueOneByOne }
}
