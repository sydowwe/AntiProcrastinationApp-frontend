import { watch } from 'vue'
import type { Ref } from 'vue'
import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import { useEarnedRewardsStore } from '@/core/todoList/store/earnedRewardsStore.ts'

/**
 * Tells the rewards store about completions and reopens this tab made, the moment they land in
 * `items`, and then re-reads the daily recap that is the real source (B2).
 *
 * Watches the rendered items rather than hooking the checkbox, because the checkbox is one of five
 * ways an item gets done in `TodoListView` alone — the last step ticked, the counter reaching its
 * total, logging time (`BaseTodoListLogTimeController` toggles the item after saving), the edit
 * dialog — and an untick has to hide the reward whichever of uncheck-all, undo or the checkbox
 * reopened it. Every one of them lands in `items` as an `isDone` change on an id that was already
 * there.
 *
 * Only a **transition** counts. An item that arrives already done — the first load, a newly created
 * id, a restored delete — says nothing about when it was done; the recap knows that, this does not.
 * An item that leaves the array is not a reopen either: the home widget drops done items on refresh.
 *
 * Every transition re-reads the recap, paired or not: the list view's "finished today" line reads
 * the same recap and would otherwise stay a tick behind.
 *
 * `resync: false` is for a host that flips `isDone` **before** its write lands (the home widget's
 * optimistic tick). A re-read on the flip would race the write, and a recap read that beats it
 * retires the observation with the old answer — the reward flashes up and disappears. Such a host
 * re-reads itself once the write has settled. `TodoListView` keeps the default: its items only
 * change after the server has answered.
 */
export function useEarnedRewardTracking(items: Ref<TodoListItemEntity[]>, { resync = true } = {}) {
	const store = useEarnedRewardsStore()

	watch(
		() => new Map(items.value.map(item => [item.id, item.isDone] as const)),
		(current, previous) => {
			let changed = false
			for (const [id, isDone] of current) {
				const wasDone = previous.get(id)
				if (wasDone === undefined || wasDone === isDone) continue
				changed = true
				if (!isDone) {
					store.observeReopened(id)
					continue
				}
				const item = items.value.find(candidate => candidate.id === id)
				if (item?.pairedLeisureActivityId != null) {
					store.observeCompleted(id, item.pairedLeisureActivityId, item.activity.name)
				}
			}
			if (changed && resync) void store.resync()
		},
	)
}
