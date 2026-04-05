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
					@openCreate="categoryDialog?.openCreate()"
					@openEdit="categoryDialog?.openEdit"
					@confirmDelete="confirmDeleteCategory"
					@toggleSort="toggleCategorySort"
					@closeDialog="categoryDrawerOpen = false"
				/>
			</VCard>
		</VDialog>

		<VRow class="my-lg-2 my-md-1 bg-background" align="stretch" style="flex: 1; min-height: 0; overflow: hidden">
			<!-- Left panel: categories (desktop) -->
			<VCol
				cols="4"
				lg="3"
				class="d-none d-md-block"
				style="height: 100%; overflow: hidden"
			>
				<VCard class="py-0" style="height: 100%; overflow: hidden">
					<TodoListCategoryPanel
						v-model:hideEmpty="hideEmptyCategories"
						v-model:filterName="categoryFilterName"
						:categories
						:selectedCategoryId
						:categorySortAsc
						@selectCategory="selectCategory"
						@openCreate="categoryDialog?.openCreate()"
						@openEdit="categoryDialog?.openEdit"
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
				<div class="py-4 pt-md-0 d-flex flex-column flex-md-row ga-3" style="flex-shrink: 0; background: rgb(var(--v-theme-background)); z-index: 10">
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
							@click="
								dialog?.openCreate(
									selectedCategoryId !== null && selectedCategoryId > 0 ? selectedCategoryId : null,
								)
							"
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
						<VCard
							v-for="list in lists"
							:key="list.id"
							elevation="1"
							class="list-card"
							@click="router.push({ name: 'toDoListDetail', params: { id: list.id } })"
						>
							<div class="pa-4">
								<div class="d-flex align-center ga-3">
									<div
										v-if="list.icon"
										class="list-icon-wrap"
									>
										<VIcon
											:icon="list.icon"
											size="20"
											color="primary"
										/>
									</div>
									<div
										class="flex-grow-1"
										style="min-width: 0"
									>
										<div
											class="text-subtitle-1 font-weight-medium"
											style="line-height: 1.3"
										>
											{{ list.name }}
										</div>
										<div
											v-if="list.description"
											class="text-caption text-medium-emphasis mt-1"
											style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
										>
											{{ list.description }}
										</div>
									</div>
									<div class="d-flex ga-2 flex-shrink-0">
										<VIconBtn
											icon="pen"
											size="40"
											color="secondaryOutline"
											variant="tonal"
											@click.stop="dialog?.openEdit(list)"
										/>
										<VIconBtn
											icon="trash"
											size="40"
											color="default"
											variant="tonal"
											@click.stop="confirmDelete(list)"
										/>
									</div>
								</div>

								<div
									v-if="list.itemCount !== null"
									class="mt-3"
								>
									<div class="d-flex justify-space-between align-center mb-1">
										<span class="text-caption text-medium-emphasis">
											{{ list.completedCount ?? 0 }} / {{ list.itemCount }} done
										</span>
										<span class="text-caption font-weight-medium">
											{{
												list.itemCount > 0
													? Math.round(((list.completedCount ?? 0) / list.itemCount) * 100)
													: 0
											}}%
										</span>
									</div>
									<VProgressLinear
										:modelValue="
											list.itemCount > 0 ? ((list.completedCount ?? 0) / list.itemCount) * 100 : 0
										"
										color="primary"
										bgColor="surface-variant"
										rounded
										height="4"
									/>
								</div>
							</div>
						</VCard>
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
							<p class="text-subtitle-2 font-weight-medium mb-1">{{ $t('toDoList.namedList.empty') }}</p>
						</template>
					</div>
					</template>
				</div>
			</VCol>
		</VRow>

		<TodoListDialog
			ref="dialog"
			@add="add"
			@edit="edit"
		/>
		<TodoListCategoryDialog
			ref="categoryDialog"
			@add="addCategory"
			@edit="editCategory"
		/>
		<MyDialog
			v-model="deleteDialog"
			:title="$t('toDoList.namedList.deleteConfirm')"
			:text="listToDelete?.name"
			confirmBtnColor="error"
			:confirmBtnLabel="$t('general.delete')"
			@confirmed="deleteConfirmed"
		/>
		<MyDialog
			v-model="deleteCategoryDialog"
			:title="$t('toDoList.category.deleteConfirm')"
			:text="categoryToDelete?.name"
			confirmBtnColor="error"
			:confirmBtnLabel="$t('general.delete')"
			@confirmed="deleteCategoryConfirmed"
		/>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { watchDebounced } from '@vueuse/core'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useTodoListCategoryCrud } from '@/api/todoList/todoListCategoryApi.ts'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'
	import type { TodoListRequest } from '@/dtos/request/todoList/TodoListRequest.ts'
	import type { TodoListCategoryEntity } from '@/dtos/response/todoList/TodoListCategoryEntity.ts'
	import type { TodoListCategoryRequest } from '@/dtos/request/todoList/TodoListCategoryRequest.ts'
	import TodoListDialog from '@/components/dialogs/toDoList/TodoListDialog.vue'
	import TodoListCategoryDialog from '@/components/dialogs/toDoList/TodoListCategoryDialog.vue'
	import TodoListCategoryPanel from '@/components/toDoList/TodoListCategoryPanel.vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'

	const router = useRouter()
	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { createWithResponse, update, deleteEntity, fetchFilteredSorted } = useTodoListCrud()
	const {
		fetchFilteredSorted: fetchCategories,
		createWithResponse: createCategory,
		update: updateCategory,
		deleteEntity: deleteCategoryEntity,
	} = useTodoListCategoryCrud()

	const categories = ref([] as TodoListCategoryEntity[])
	const lists = ref([] as TodoListEntity[])
	const loading = ref(false)
	const selectedCategoryId = ref<number | null>(null)
	const categorySortAsc = ref(true)
	const hideEmptyCategories = ref(false)
	const categoryFilterName = ref<string | null>(null)
	const listFilterName = ref<string | null>(null)
	const listSortAsc = ref(true)
	const categoryDrawerOpen = ref(false)
	const dialog = ref<InstanceType<typeof TodoListDialog>>()
	const categoryDialog = ref<InstanceType<typeof TodoListCategoryDialog>>()
	const deleteDialog = ref(false)
	const listToDelete = ref<TodoListEntity | null>(null)
	const deleteCategoryDialog = ref(false)
	const categoryToDelete = ref<TodoListCategoryEntity | null>(null)

	onMounted(async () => {
		await Promise.all([loadCategories(), loadLists()])
	})

	watch(listSortAsc, loadLists)
	watch(hideEmptyCategories, loadCategories)
	watchDebounced(categoryFilterName, loadCategories, { debounce: 300 })
	watchDebounced(listFilterName, loadLists, { debounce: 300 })

	async function loadCategories() {
		categories.value = await fetchCategories(
			categorySortAsc.value,
			hideEmptyCategories.value,
			categoryFilterName.value?.trim() || null,
		)
	}

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

	async function selectCategory(id: number | null) {
		selectedCategoryId.value = id
		await loadLists()
	}

	async function onMobileSelectCategory(id: number | null) {
		await selectCategory(id)
		categoryDrawerOpen.value = false
	}

	async function toggleCategorySort() {
		categorySortAsc.value = !categorySortAsc.value
		await loadCategories()
	}

	function toggleListSort() {
		listSortAsc.value = !listSortAsc.value
	}

	async function add(request: TodoListRequest) {
		await createWithResponse(request)
		await Promise.all([loadCategories(), loadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function edit(id: number, request: TodoListRequest) {
		await update(id, request)
		await Promise.all([loadCategories(), loadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.edited'))
	}

	function confirmDelete(list: TodoListEntity) {
		listToDelete.value = list
		deleteDialog.value = true
	}

	async function deleteConfirmed() {
		if (!listToDelete.value) return
		await deleteEntity(listToDelete.value.id)
		lists.value = lists.value.filter(l => l.id !== listToDelete.value!.id)
		listToDelete.value = null
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.deleted'))
	}

	async function addCategory(request: TodoListCategoryRequest) {
		request.color ??= 'default'
		await createCategory(request)
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function editCategory(id: number, request: TodoListCategoryRequest) {
		await updateCategory(id, request)
		await loadCategories()
		showSuccessSnackbar(i18n.t('successFeedback.edited'))
	}

	function confirmDeleteCategory(category: TodoListCategoryEntity) {
		categoryToDelete.value = category
		deleteCategoryDialog.value = true
	}

	async function deleteCategoryConfirmed() {
		if (!categoryToDelete.value) return
		await deleteCategoryEntity(categoryToDelete.value.id)
		if (selectedCategoryId.value === categoryToDelete.value.id) {
			selectedCategoryId.value = null
		}
		categoryToDelete.value = null
		await Promise.all([loadCategories(), loadLists()])
		showSuccessSnackbar(i18n.t('successFeedback.deleted'))
	}
</script>

<style scoped>
	.list-card {
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}

	.list-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 28px -4px rgba(0, 0, 0, 0.28) !important;
	}

	.list-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		flex-shrink: 0;
		background: rgba(var(--v-theme-primary), 0.1);
	}

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
