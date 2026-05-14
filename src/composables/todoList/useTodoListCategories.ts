import { ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { useTodoListCategoryCrud } from '@/api/todoList/todoListCategoryApi.ts'
import type { TodoListCategoryEntity } from '@/dtos/response/todoList/TodoListCategoryEntity.ts'
import type { TodoListCategoryRequest } from '@/dtos/request/todoList/TodoListCategoryRequest.ts'

export function useTodoListCategories(reloadLists: () => Promise<void>) {
	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { fetchFilteredSorted, createWithResponse, update, deleteEntity } = useTodoListCategoryCrud()

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

	function confirmDeleteCategory(category: TodoListCategoryEntity) {
		categoryToDelete.value = category
		deleteCategoryDialog.value = true
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
