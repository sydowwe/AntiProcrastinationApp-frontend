import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useTodoListCategoryCrud } from '@/core/todoList/api/todoListCategoryApi.ts'
import type { TodoListCategoryEntity } from '@/core/todoList/dto/response/TodoListCategoryEntity.ts'
import type { TodoListCategoryRequest } from '@/core/todoList/dto/request/TodoListCategoryRequest.ts'
import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'

export function useTodoListCategories(reloadLists: () => Promise<void>) {
	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { fetchFilteredSorted, createWithResponse, update, deleteEntity } = useTodoListCategoryCrud()
	const { shouldConfirm } = useDeleteConfirmation()

	const categories = ref<TodoListCategoryEntity[]>([])
	const selectedCategoryId = ref<number | null>(null)
	const categorySortAsc = ref(true)
	const hideEmptyCategories = ref(false)
	const categoryFilterName = ref<string | null>(null)
	const categoryDrawerOpen = ref(false)
	const deleteCategoryDialog = ref(false)
	const categoryToDelete = ref<TodoListCategoryEntity | null>(null)

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
	const deleteCategoryKeepsLists = computed(() => {
		const listCount = categoryToDelete.value?.listCount ?? 0
		return listCount > 0 ? i18n.t('toDoList.category.deleteKeepsLists', { count: listCount }) : null
	})

	async function confirmDeleteCategory(category: TodoListCategoryEntity) {
		categoryToDelete.value = category
		if (shouldConfirm({ cascades: false, undoable: false })) {
			deleteCategoryDialog.value = true
		} else {
			await deleteCategoryConfirmed()
		}
	}

	async function deleteCategoryConfirmed() {
		if (!categoryToDelete.value) return
		await deleteEntity(categoryToDelete.value.id)
		if (selectedCategoryId.value === categoryToDelete.value.id) {
			selectedCategoryId.value = null
		}
		categoryToDelete.value = null
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
		deleteCategoryDialog,
		categoryToDelete,
		deleteCategoryKeepsLists,
		loadCategories,
		selectCategory,
		onMobileSelectCategory,
		toggleCategorySort,
		addCategory,
		editCategory,
		confirmDeleteCategory,
		deleteCategoryConfirmed,
	}
}
