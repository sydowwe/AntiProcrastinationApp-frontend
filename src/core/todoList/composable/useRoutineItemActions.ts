import type { Ref } from 'vue'
import { RoutineTodoListItemRequest } from '@/core/todoList/dto/request/RoutineTodoListItemRequest.ts'
import { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
import { useUndoableListCrud } from '@/core/todoList/composable/useUndoableListCrud.ts'
import { useEstimateCalibration } from '@/core/todoList/composable/useEstimateCalibration.ts'
import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'
import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

/** The one field of `@atlaskit/pragmatic-drag-and-drop`'s drop target this view actually reads. */
interface CrossListDropTarget {
	data: {
		type: string
		index: number
		position?: 'top' | 'bottom'
	}
}

/**
 * Every operation that mutates `groupedItems`. `add`/`edit`/`deleteItem`/`handleOrderChange`/
 * `handleUncheckAll` are the grouped half of the shared undo-wrapped CRUD — see
 * `useUndoableListCrud`. `handleCrossListDrop` stays bespoke: moving an item between time periods
 * is two API calls with a compound inverse, which has no counterpart on a single-container list.
 */
export function useRoutineItemActions(
	groupedItems: Ref<RoutineTodoListGroupedList[]>,
	celebrateIfRare: (before: RoutineTimePeriodEntity, after: RoutineTimePeriodEntity) => void,
) {
	const {
		fetchById,
		createWithResponse,
		update,
		deleteEntity,
		changeDisplayOrder,
		toggleIsDone,
		uncheckAll: uncheckAllApi,
	} = useRoutineTodoListItemCrud()
	const { pushReorderUndo } = useTodoListUndo()
	const { ensureLoaded: ensureCalibrationLoaded } = useEstimateCalibration()

	/**
	 * Re-reads the named items and reconciles them into the grouped list — the routine list's half of
	 * `UndoableListAdapter.resync`, so an edit that changes an item's time period arrives here too.
	 * That is why the old group is looked up by *where the item currently is* rather than by the time
	 * period the caller last saw: a moved item has to leave its previous group, or it shows up twice.
	 */
	async function onItemsChanged(changedItems: number[]) {
		for (const id of changedItems) {
			const updatedItem = await fetchById(id)
			const previousGroup = groupedItems.value.find(g => g.items.some(item => item.id === id))
			const group = groupedItems.value.find(g => g.timePeriod.id === updatedItem.timePeriod.id)
			if (previousGroup && previousGroup !== group) {
				previousGroup.items = previousGroup.items.filter(item => item.id !== id)
			}
			if (!group) continue
			const index = group.items.findIndex(item => item.id === id)
			if (index !== -1) {
				group.items[index] = updatedItem
			} else {
				group.items.push(updatedItem)
				group.items.sort((a, b) => a.id - b.id)
			}
			// Keep the group's stats (streak, consistency, history) in step with the refetched item,
			// then judge whether the change was rare enough to celebrate.
			const previousTimePeriod = group.timePeriod
			// isHidden is local view state (the group selector mutates it without persisting),
			// so it must survive the refresh.
			updatedItem.timePeriod.isHidden = previousTimePeriod.isHidden
			group.timePeriod = updatedItem.timePeriod
			celebrateIfRare(previousTimePeriod, updatedItem.timePeriod)
		}
	}

	const listCrud = useUndoableListCrud<RoutineTodoListItemEntity, RoutineTodoListItemRequest>(
		{ createWithResponse, update, deleteEntity, changeDisplayOrder, toggleIsDone, uncheckAll: uncheckAllApi },
		{
			containerOf: id => groupedItems.value.find(group => group.items.some(item => item.id === id))?.items,
			insert(entity) {
				const targetGroup = groupedItems.value.find(group => group.timePeriod.id === entity.timePeriod.id)
				if (!targetGroup) return
				targetGroup.items.push(entity)
				targetGroup.items.sort((a, b) => a.id - b.id)
			},
			resync: onItemsChanged,
			requestFromEntity: entity => RoutineTodoListItemRequest.fromEntity(entity),
			labelOf: entity => entity.activity.name,
		},
		{ editedMessageKey: 'successFeedback.updated' },
	)

	async function add(request: RoutineTodoListItemRequest) {
		const created = await listCrud.add(request)
		void ensureCalibrationLoaded([created.activity.id])
		return created
	}

	async function handleCrossListDrop(
		sourceListId: number,
		targetListId: number,
		itemId: number,
		dropTarget: CrossListDropTarget,
	) {
		const sourceGroup = groupedItems.value.find(g => g.timePeriod.id === sourceListId)
		const targetGroup = groupedItems.value.find(g => g.timePeriod.id === targetListId)

		if (!sourceGroup || !targetGroup) return

		const sourceIndex = sourceGroup.items.findIndex(item => item.id === itemId)
		const movedItem = sourceGroup.items[sourceIndex]

		if (!movedItem) return

		const originalPrecedingId = sourceIndex > 0 ? (sourceGroup.items[sourceIndex - 1]?.id ?? null) : null
		const originalFollowingId =
			sourceIndex < sourceGroup.items.length - 1 ? (sourceGroup.items[sourceIndex + 1]?.id ?? null) : null

		sourceGroup.items.splice(sourceIndex, 1)

		let targetIndex = 0
		if (dropTarget.data.type === 'drop-zone') {
			targetIndex = dropTarget.data.index
			if (dropTarget.data.position === 'bottom') {
				targetIndex += 1
			}
		}
		targetGroup.items.splice(targetIndex, 0, movedItem)

		const updateRequest = new RoutineTodoListItemRequest(
			movedItem.activity.id,
			targetListId,
			movedItem.doneCount,
			movedItem.totalCount,
			movedItem.isDone,
		)
		await update(itemId, updateRequest)

		const precedingItem = targetIndex > 0 ? targetGroup.items[targetIndex - 1] : null
		const followingItem = targetIndex < targetGroup.items.length - 1 ? targetGroup.items[targetIndex + 1] : null
		const orderRequest = new ChangeDisplayOrderRequest(itemId, precedingItem?.id ?? null, followingItem?.id ?? null)
		await changeDisplayOrder(orderRequest)

		const reverseUpdateRequest = new RoutineTodoListItemRequest(
			movedItem.activity.id,
			sourceListId,
			movedItem.doneCount,
			movedItem.totalCount,
			movedItem.isDone,
		)
		const reverseOrderRequest = new ChangeDisplayOrderRequest(itemId, originalPrecedingId, originalFollowingId)
		pushReorderUndo(movedItem.activity.name, async () => {
			await update(itemId, reverseUpdateRequest)
			await changeDisplayOrder(reverseOrderRequest)
			const currentTarget = groupedItems.value.find(g => g.timePeriod.id === targetListId)
			const currentSource = groupedItems.value.find(g => g.timePeriod.id === sourceListId)
			if (currentTarget && currentSource) {
				const idx = currentTarget.items.findIndex(i => i.id === itemId)
				if (idx !== -1) {
					const [item] = currentTarget.items.splice(idx, 1)
					if (item) currentSource.items.splice(sourceIndex, 0, item)
				}
			}
		})
	}

	return {
		add,
		edit: listCrud.edit,
		deleteItem: listCrud.deleteItem,
		handleOrderChange: listCrud.handleOrderChange,
		handleUncheckAll: listCrud.handleUncheckAll,
		handleIsDoneChange: listCrud.handleIsDoneChange,
		handleCrossListDrop,
		onItemsChanged,
	}
}
