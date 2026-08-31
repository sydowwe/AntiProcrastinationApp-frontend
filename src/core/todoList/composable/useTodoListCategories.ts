import { ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useTodoListCategoryCrud } from '@/core/todoList/api/todoListCategoryApi.ts'
import type { TodoListCategoryEntity } from '@/core/todoList/dto/response/TodoListCategoryEntity.ts'
import type { TodoListCategoryRequest } from '@/core/todoList/dto/request/TodoListCategoryRequest.ts'
import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
import { useDialog } from '@/_common/composable/general/useDialog.ts'

export function useTodoListCategories(reloadLists: () => Promise<void>) {
	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { fetchFilteredSorted, createWithResponse, update, deleteEntity } = useTodoListCategoryCrud()
	const { shouldConfirm } = useDeleteConfirmation()
	const { confirm } = useDialog()

	const categories = ref<TodoListCategoryEntity[]>([])
	const selectedCategoryId = ref<number | null>(null)
	const categorySortAsc = ref(true)
	const hideEmptyCategories = ref(false)
	const categoryFilterName = ref<string | null>(null)
	const categoryDrawerOpen = ref(false)

	watch(hideEmptyCategories, loadCategories)
	watchDebounced(categoryFilterName, loadCategories, { debounce: 300 })

	async function loadCategories() {
		categories.value = await fetchFilteredSorted(
			categorySortAsc.value,
			hideEmptyCategories.value,
			categoryFilterName.value?.trim() || null,
		)
	}

	async function selectCategory(id: number | null) {
		selectedCategoryId.value = id
		await reloadLists()
	}

	async function onMobileSelectCategory(id: number | null) {
		await selectCategory(id)
		categoryDrawerOpen.value = false
	}

	async function toggleCategorySort() {
		categorySortAsc.value = !categorySortAsc.value
		await loadCategories()
	}

	async function addCategory(request: TodoListCategoryRequest) {
		request.color ??= 'default'
		await createWithResponse(request)
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function editCategory(id: number, request: TodoListCategoryRequest) {
		await update(id, request)
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.edited'))
	}

	// B4 answered: a category delete does NOT cascade. The lists that pointed at it are orphaned —
	// their `categoryId` is set to null — and neither they nor their items are touched. That is a
	// deliberate product rule, not an FK artefact (the sibling list→items edge is explicitly a
	// cascade). So a category is a leaf delete and honours `askBeforeDelete` like the others; the
	// copy below only reassures, it does not warn.
	//
	// Note the count rarely renders: the category response does not currently carry `listCount`, so
	// it is null in practice. Left conditional so the line appears if the server ever sends it.
	async function confirmDeleteCategory(category: TodoListCategoryEntity) {
		if (shouldConfirm({ cascades: false, undoable: false })) {
			const listCount = category.listCount ?? 0
			const confirmed = await confirm({
				title: i18n.t('toDoList.category.deleteConfirm'),
				text: category.name,
				detail: listCount > 0 ? i18n.t('toDoList.category.deleteKeepsLists', { count: listCount }) : undefined,
				confirmBtnLabel: i18n.t('general.delete'),
				confirmBtnColor: 'error',
			})
			if (!confirmed) return
		}
		await deleteCategory(category)
	}

	async function deleteCategory(category: TodoListCategoryEntity) {
		await deleteEntity(category.id)
		if (selectedCategoryId.value === category.id) {
			selectedCategoryId.value = null
		}
		await Promise.all([loadCategories(), reloadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.deleted'))
	}

	return {
		categories,
		selectedCategoryId,
		categorySortAsc,
		hideEmptyCategories,
		categoryFilterName,
		categoryDrawerOpen,
		loadCategories,
		selectCategory,
		onMobileSelectCategory,
		toggleCategorySort,
		addCategory,
		editCategory,
		confirmDeleteCategory,
	}
}
