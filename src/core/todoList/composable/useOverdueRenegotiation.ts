import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
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
	 * Moves every past-due item to today (`days = 0`) or a week out (`days = 7`). Both are measured
	 * from today rather than from each item's own date, so the pile actually clears instead of
	 * shifting a month-old task to three weeks old.
	 */
	async function rescheduleOverdue(days: number) {
		const targets = overdueItems.value
		if (targets.length === 0) return
		const previous = targets.map(item => ({ id: item.id, request: ToDoListItemRequest.fromEntity(item) }))
		// Measured from the *user's* today, and persisted — a browser-zone midnight here writes the
		// wrong due date for anyone whose profile zone differs from their device's.
		const newDueDate = formatDateForApi(startOfUserDayPlus(days))
		isRenegotiating.value = true
		try {
			await Promise.all(
				targets.map(item => {
					const request = ToDoListItemRequest.fromEntity(item)
					request.dueDate = newDueDate
					return deps.update(item.id, request)
				}),
			)
			showSuccessSnackbar(
				i18n.t(
					days === 0 ? 'toDoList.renegotiate.movedToToday' : 'toDoList.renegotiate.movedByWeek',
					{ count: targets.length },
					targets.length,
				),
			)
			pushBulkRescheduleUndo(targets.length, async () => {
				await Promise.all(previous.map(({ id, request }) => deps.update(id, request)))
				items.value = await deps.fetchAll()
			})
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
