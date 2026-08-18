<template>
	<div style="position: relative; height: 100%; width: 100%; display: flex; flex-direction: column; overflow: hidden">
		<!-- Mobile: full-area category dialog -->
		<VDialog
			v-model="categoryDrawerOpen"
			contained
			fullscreen
			transition="slide-x-transition"
			class="d-md-none"
			:scrim="false"
			style="margin: -12px"
		>
			<VCard
				height="100%"
				rounded="0"
			>
				<TodoListCategoryPanel
					v-model:hideEmpty="hideEmptyCategories"
					v-model:filterName="categoryFilterName"
					:categories
					:selectedCategoryId
					:categorySortAsc
					@selectCategory="onMobileSelectCategory"
					@openCreate="openCategoryCreateDialog"
					@openEdit="openCategoryEditDialog"
					@confirmDelete="confirmDeleteCategory"
					@toggleSort="toggleCategorySort"
					@closeDialog="categoryDrawerOpen = false"
				/>
			</VCard>
		</VDialog>

		<VRow
			class="my-lg-2 my-md-1 bg-background"
			align="stretch"
			style="flex: 1; min-height: 0; overflow: hidden"
		>
			<!-- Left panel: categories (desktop) -->
			<VCol
				cols="4"
				lg="3"
				class="d-none d-md-block"
				style="height: 100%; overflow: hidden"
			>
				<VCard
					class="py-0"
					style="height: 100%; overflow: hidden"
				>
					<TodoListCategoryPanel
						v-model:hideEmpty="hideEmptyCategories"
						v-model:filterName="categoryFilterName"
						:categories
						:selectedCategoryId
						:categorySortAsc
						@selectCategory="selectCategory"
						@openCreate="openCategoryCreateDialog"
						@openEdit="openCategoryEditDialog"
						@confirmDelete="confirmDeleteCategory"
						@toggleSort="toggleCategorySort"
					/>
				</VCard>
			</VCol>

			<!-- Right panel: lists -->
			<VCol
				cols="12"
				md="8"
				lg="9"
				class="bg-background"
				style="height: 100%; overflow: hidden; display: flex; flex-direction: column"
			>
				<div
					class="py-4 pt-md-0 d-flex flex-column flex-md-row ga-3"
					style="flex-shrink: 0; background: rgb(var(--v-theme-background)); z-index: 10"
				>
					<div class="d-flex align-center ga-3">
						<VBtn
							prependIcon="bars"
							variant="tonal"
							class="d-md-none"
							@click="categoryDrawerOpen = true"
						>
							Categories
						</VBtn>
						<VBtn
							color="primary"
							appendIcon="plus"
							class="flex-grow-1 flex-md-grow-0"
							@click="openListCreateDialog"
						>
							{{ $t('toDoList.namedList.add') }}
						</VBtn>
					</div>
					<div class="d-flex flex-md-fill align-center ga-3">
						<VTextField
							v-model="listFilterName"
							class="mx-auto"
							:label="$t('general.search')"
							prependInnerIcon="magnifying-glass"
							density="compact"
							clearable
							hideDetails
							maxWidth="350"
						/>
						<VIconBtn
							:icon="listSortAsc ? 'sort-alpha-down' : 'sort-alpha-up'"
							density="comfortable"
							variant="outlined"
							color="secondaryOutline"
							style="height: 40px; width: 40px"
							@click="toggleListSort"
						/>
					</div>
				</div>

				<div style="flex: 1; overflow-y: auto; min-height: 0">
					<div
						v-if="loading"
						class="d-flex flex-column ga-3"
					>
						<VCard
							v-for="i in 3"
							:key="i"
							elevation="1"
						>
							<VSkeletonLoader type="list-item-two-line" />
						</VCard>
					</div>

					<template v-else>
						<TransitionGroup
							name="list-fade"
							tag="div"
							class="d-flex flex-column ga-3"
						>
							<TodoListCard
								v-for="list in lists"
								:key="list.id"
								:list
								@openEdit="openListEditDialog(list)"
								@confirmDelete="confirmDelete(list)"
							/>
						</TransitionGroup>

						<div
							v-if="lists.length === 0"
							class="empty-state"
						>
							<VIcon
								icon="inbox"
								size="40"
								class="mb-3"
								style="opacity: 0.3"
							/>
							<template v-if="listFilterName?.trim()">
								<p class="text-subtitle-2 font-weight-medium mb-1">
									{{ $t('toDoList.namedList.emptyFilter') }}
								</p>
							</template>
							<template v-else-if="selectedCategoryId !== null">
								<p class="text-subtitle-2 font-weight-medium mb-1">
									{{ $t('toDoList.namedList.emptyCategory') }}
								</p>
							</template>
							<template v-else>
								<p class="text-subtitle-2 font-weight-medium mb-1">
									{{ $t('toDoList.namedList.empty') }}
								</p>
							</template>
						</div>
					</template>
				</div>
			</VCol>
		</VRow>

		<MyDialog
			v-model="deleteDialog"
			:title="$t('toDoList.namedList.deleteConfirm')"
			confirmBtnColor="error"
			:confirmBtnLabel="$t('general.delete')"
			@confirmed="deleteConfirmed"
		>
			<!-- Slot rather than the `text` prop: a cascading delete adds a second line naming how many
			     children go with it, and the prop renders a single run of text. -->
			<div class="px-6 py-4 text-center">
				<div>{{ listToDelete?.name }}</div>
				<div
					v-if="deleteListCascade"
					class="mt-2 font-weight-medium"
				>
					{{ deleteListCascade }}
				</div>
			</div>
		</MyDialog>
		<MyDialog
			v-model="deleteCategoryDialog"
			:title="$t('toDoList.category.deleteConfirm')"
			confirmBtnColor="error"
			:confirmBtnLabel="$t('general.delete')"
			@confirmed="deleteCategoryConfirmed"
		>
			<div class="px-6 py-4 text-center">
				<div>{{ categoryToDelete?.name }}</div>
				<div
					v-if="deleteCategoryCascade"
					class="mt-2 font-weight-medium"
				>
					{{ deleteCategoryCascade }}
				</div>
			</div>
		</MyDialog>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { watchDebounced } from '@vueuse/core'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { useTodoListCategories } from '@/core/todoList/composable/useTodoListCategories.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
	import type { TodoListRequest } from '@/core/todoList/dto/request/TodoListRequest.ts'
	import type { TodoListCategoryEntity } from '@/core/todoList/dto/response/TodoListCategoryEntity.ts'
	import type { TodoListCategoryRequest } from '@/core/todoList/dto/request/TodoListCategoryRequest.ts'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import TodoListCategoryPanel from '@/core/todoList/component/normal/TodoListCategoryPanel.vue'
	import TodoListForm from '@/core/todoList/component/normal/TodoListForm.vue'
	import TodoListCategoryForm from '@/core/todoList/component/normal/TodoListCategoryForm.vue'
	import TodoListCard from '@/core/todoList/component/normal/TodoListCard.vue'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const i18n = useI18n()
	const { shouldConfirm } = useDeleteConfirmation()
	const { showSuccessSnackbar } = useSnackbar()
	const { createWithResponse, update, deleteEntity, fetchFilteredSorted } = useTodoListCrud()
	const { openDialog } = useDialog()

	const lists = ref<TodoListEntity[]>([])
	const loading = ref(false)
	const listFilterName = ref<string | null>(null)
	const listSortAsc = ref(true)
	const deleteDialog = ref(false)
	const listToDelete = ref<TodoListEntity | null>(null)

	const {
		categories,
		selectedCategoryId,
		categorySortAsc,
		hideEmptyCategories,
		categoryFilterName,
		categoryDrawerOpen,
		deleteCategoryDialog,
		categoryToDelete,
		deleteCategoryCascade,
		loadCategories,
		selectCategory,
		onMobileSelectCategory,
		toggleCategorySort,
		addCategory,
		editCategory,
		confirmDeleteCategory,
		deleteCategoryConfirmed,
	} = useTodoListCategories(loadLists)

	onMounted(async () => {
		await Promise.all([loadCategories(), loadLists()])
	})

	watch(listSortAsc, loadLists)
	watchDebounced(listFilterName, loadLists, { debounce: 300 })

	async function loadLists() {
		loading.value = true
		try {
			lists.value = await fetchFilteredSorted(
				listSortAsc.value,
				selectedCategoryId.value,
				listFilterName.value?.trim() || null,
			)
		} finally {
			loading.value = false
		}
	}

	function toggleListSort() {
		listSortAsc.value = !listSortAsc.value
	}

	async function openListCreateDialog() {
		const result = await openDialog<{ idToEdit: number | null; request: TodoListRequest }>({
			component: TodoListForm,
			componentProps: { initialCategoryId: selectedCategoryId.value },
			dialogProps: { title: i18n.t('toDoList.namedList.add'), confirmBtnLabel: i18n.t('general.add') },
		})
		if (!result) return
		await createWithResponse(result.request)
		await Promise.all([loadCategories(), loadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function openListEditDialog(entity: TodoListEntity) {
		const result = await openDialog<{ idToEdit: number | null; request: TodoListRequest }>({
			component: TodoListForm,
			componentProps: { entityToEdit: entity },
			dialogProps: { title: i18n.t('general.edit'), confirmBtnLabel: i18n.t('general.edit') },
		})
		if (!result || result.idToEdit === null) return
		await update(result.idToEdit, result.request)
		await Promise.all([loadCategories(), loadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.edited'))
	}

	async function openCategoryCreateDialog() {
		const result = await openDialog<{ idToEdit: number | null; request: TodoListCategoryRequest }>({
			component: TodoListCategoryForm,
			dialogProps: { title: i18n.t('toDoList.category.add'), confirmBtnLabel: i18n.t('general.add') },
		})
		if (!result) return
		await addCategory(result.request)
	}

	async function openCategoryEditDialog(entity: TodoListCategoryEntity) {
		const result = await openDialog<{ idToEdit: number | null; request: TodoListCategoryRequest }>({
			component: TodoListCategoryForm,
			componentProps: { entityToEdit: entity },
			dialogProps: { title: i18n.t('general.edit'), confirmBtnLabel: i18n.t('general.edit') },
		})
		if (!result || result.idToEdit === null) return
		await editCategory(result.idToEdit, result.request)
	}

	// A list takes its items with it, so a non-empty list always confirms and the dialog says how
	// many — the preference does not get a vote on that. An empty list is a leaf.
	const deleteListCascade = computed(() => {
		const itemCount = listToDelete.value?.itemCount ?? 0
		return itemCount > 0 ? i18n.t('toDoList.namedList.deleteCascade', { count: itemCount }) : null
	})

	async function confirmDelete(list: TodoListEntity) {
		listToDelete.value = list
		if (shouldConfirm({ cascades: (list.itemCount ?? 0) > 0, undoable: false })) {
			deleteDialog.value = true
		} else {
			await deleteConfirmed()
		}
	}

	async function deleteConfirmed() {
		if (!listToDelete.value) return
		await deleteEntity(listToDelete.value.id)
		lists.value = lists.value.filter(l => l.id !== listToDelete.value!.id)
		listToDelete.value = null
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.deleted'))
	}
</script>

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}

	.list-fade-enter-active {
		transition:
			opacity 0.25s ease,
			transform 0.25s ease;
	}

	.list-fade-enter-from {
		opacity: 0;
		transform: translateY(6px);
	}
</style>
