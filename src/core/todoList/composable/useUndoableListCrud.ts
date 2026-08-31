import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { hasObjectChanged } from '@/_common/utils/helperMethods.ts'
import { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'

export interface UndoableListItem {
	id: number
}

/**
 * The slice of a to-do list item API this composable drives. `useTodoListItemCrud` and
 * `useRoutineTodoListItemCrud` both already satisfy it — nothing had to change on either side.
 */
export interface UndoableListApi<TEntity, TRequest> {
	createWithResponse(request: TRequest): Promise<TEntity>
	update(id: number, request: TRequest): Promise<unknown>
	deleteEntity(id: number): Promise<unknown>
	changeDisplayOrder(request: ChangeDisplayOrderRequest): Promise<unknown>
	toggleIsDone(id: number, forceValue?: boolean): Promise<unknown>
	uncheckAll(doneIds: number[]): Promise<unknown>
}

/**
 * Everything that differs between a flat list and a grouped one. The normal list is one array; the
 * routine list is one array per time period. Both answer the same four questions, so every operation
 * below is written once.
 */
export interface UndoableListAdapter<TEntity extends UndoableListItem, TRequest> {
	/**
	 * The live array currently holding `id`, or `undefined` if nothing does. Resolved on every call
	 * rather than captured: an undo runs long after the array it was queued from may have been
	 * replaced, and a stale reference reorders a detached copy.
	 */
	containerOf(id: number): TEntity[] | undefined
	/** Places a newly created entity into local state, in whatever order this list displays in. */
	insert(entity: TEntity): void | Promise<void>
	/**
	 * Places a *restored* entity back after a delete has been undone. Defaults to {@link insert}.
	 * A list whose display order is server-owned needs this to differ: by the time it runs, the
	 * restore has already re-sent the original neighbours, so the authoritative order is the
	 * server's and not whatever local sort `insert` applies.
	 */
	reinsert?(entity: TEntity): void | Promise<void>
	/** Reconciles the named items with the server. */
	resync(ids: number[]): Promise<void>
	requestFromEntity(entity: TEntity): TRequest
	/** Name shown in the undo stack's description. */
	labelOf(entity: TEntity): string
}

/**
 * The seven undo-wrapped CRUD operations shared by `TodoListView` and `RoutineToDoListView`. Each one
 * is "call the API, splice local state, push the inverse onto the undo stack" — written twice before,
 * and drifted in the small ways that only show up on the undo path.
 */
export function useUndoableListCrud<TEntity extends UndoableListItem, TRequest extends object>(
	api: UndoableListApi<TEntity, TRequest>,
	adapter: UndoableListAdapter<TEntity, TRequest>,
	options: { editedMessageKey?: string } = {},
) {
	const { editedMessageKey = 'successFeedback.edited' } = options
	const { t } = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { pushDeleteUndo, pushUncheckAllUndo, pushReorderUndo, pushEditUndo } = useTodoListUndo()

	function locate(id: number) {
		const list = adapter.containerOf(id)
		if (!list) return undefined
		const index = list.findIndex(item => item.id === id)
		return index === -1 ? undefined : { list, index }
	}

	/** The two ids `changeDisplayOrder` needs to put an item back exactly where it was. */
	function neighboursAt(list: TEntity[], index: number) {
		return {
			precedingId: index > 0 ? (list[index - 1]?.id ?? null) : null,
			followingId: index < list.length - 1 ? (list[index + 1]?.id ?? null) : null,
		}
	}

	async function restoreInto(entity: TEntity) {
		await (adapter.reinsert ?? adapter.insert)(entity)
	}

	/** No undo entry: an unwanted add is a delete away, and the item is on screen to be deleted. */
	async function add(request: TRequest) {
		const created = await api.createWithResponse(request)
		await adapter.insert(created)
		showSuccessSnackbar(t('successFeedback.added'))
		return created
	}

	/**
	 * A no-op edit is dropped before it reaches the server — otherwise closing the dialog on an
	 * untouched form claims a success and leaves an undo entry that undoes nothing.
	 */
	async function edit(entity: TEntity, request: TRequest) {
		const savedRequest = adapter.requestFromEntity(entity)
		if (!hasObjectChanged(savedRequest, request)) return
		await api.update(entity.id, request)
		await adapter.resync([entity.id])
		showSuccessSnackbar(t(editedMessageKey))
		pushEditUndo(adapter.labelOf(entity), async () => {
			await api.update(entity.id, savedRequest)
			await adapter.resync([entity.id])
		})
	}

	async function deleteItem(id: number) {
		const located = locate(id)
		if (!located) return
		const { list, index } = located
		const savedItem = list[index]!
		const { precedingId, followingId } = neighboursAt(list, index)
		await api.deleteEntity(id)
		list.splice(index, 1)
		pushDeleteUndo(adapter.labelOf(savedItem), async () => {
			// The restore is a create, so it comes back with a new id — the display order has to be
			// re-sent against the neighbours captured above or it lands at the end of the list.
			const restored = await api.createWithResponse(adapter.requestFromEntity(savedItem))
			await api.changeDisplayOrder(new ChangeDisplayOrderRequest(restored.id, precedingId, followingId))
			await restoreInto(restored)
		})
	}

	/**
	 * Which list the item is in comes from `request.movedItemId`, so a grouped caller does not have to
	 * pass its group id — the item is still in its source container when this runs.
	 */
	async function handleOrderChange(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) {
		const list = adapter.containerOf(request.movedItemId)
		if (!list) return
		const movedItem = list[oldIndex]
		if (!movedItem) return
		const { precedingId, followingId } = neighboursAt(list, oldIndex)
		const [moved] = list.splice(oldIndex, 1)
		if (moved) list.splice(newIndex, 0, moved)
		await api.changeDisplayOrder(request)
		const reverseRequest = new ChangeDisplayOrderRequest(movedItem.id, precedingId, followingId)
		pushReorderUndo(adapter.labelOf(movedItem), async () => {
			await api.changeDisplayOrder(reverseRequest)
			const currentList = adapter.containerOf(movedItem.id)
			if (!currentList) return
			const currentIndex = currentList.findIndex(item => item.id === movedItem.id)
			if (currentIndex === -1) return
			const [movedBack] = currentList.splice(currentIndex, 1)
			if (movedBack) currentList.splice(oldIndex, 0, movedBack)
		})
	}

	async function handleUncheckAll(doneIds: number[]) {
		await api.uncheckAll(doneIds)
		await adapter.resync(doneIds)
		pushUncheckAllUndo(doneIds.length, async () => {
			for (const id of doneIds) await api.toggleIsDone(id, true)
			await adapter.resync(doneIds)
		})
	}

	/** Deliberately un-undoable: the checkbox is its own inverse, one click away. */
	async function handleIsDoneChange(id: number, forceValue?: boolean) {
		await api.toggleIsDone(id, forceValue)
		await adapter.resync([id])
	}

	return {
		add,
		edit,
		deleteItem,
		handleOrderChange,
		handleUncheckAll,
		handleIsDoneChange,
		locate,
		neighboursAt,
	}
}
