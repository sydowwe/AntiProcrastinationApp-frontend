import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import { RENEGOTIATE_THRESHOLD } from '@/core/todoList/composable/useOverdueRenegotiation.ts'

// Schedule-first: unscheduled is the incomplete state, so the list says so — but only about the
// items the user can actually see (filters and "hide done" apply), and never twice. A banner that
// counts invisible items sends you to an item that is not on screen.
export function useUnscheduledNudge(
	displayedItems: ComputedRef<TodoListItemEntity[]>,
	isInChangeOrderMode: Ref<boolean>,
	overdueCount: ComputedRef<number>,
	openAddToPlanner: (item: TodoListItemEntity) => void,
) {
	const unscheduledNudgeDismissed = ref(false)

	const pendingItems = computed(() => displayedItems.value.filter(item => !item.isDone))

	const unscheduledItems = computed(() => pendingItems.value.filter(item => !item.dueDate))

	const showUnscheduledNudge = computed(
		() =>
			!unscheduledNudgeDismissed.value &&
			!isInChangeOrderMode.value &&
			unscheduledItems.value.length > 0 &&
			// A short list does not need a banner, and an overdue pile is the more urgent conversation —
			// two stacked nudges is exactly the nagging this is supposed to avoid.
			pendingItems.value.length > 2 &&
			overdueCount.value < RENEGOTIATE_THRESHOLD,
	)

	function openFirstUnscheduled() {
		const firstUnscheduled = unscheduledItems.value[0]
		if (firstUnscheduled) openAddToPlanner(firstUnscheduled)
	}

	return { unscheduledNudgeDismissed, pendingItems, unscheduledItems, showUnscheduledNudge, openFirstUnscheduled }
}
