<template>
<!-- Mobile: slide-out category drawer -->
<VNavigationDrawer v-model="categoryDrawerOpen" temporary location="left" class="d-md-none" width="280">
	<TodoListCategoryPanel
		:categories :selectedCategoryId :categorySortAsc
		@selectCategory="onMobileSelectCategory"
		@openCreate="categoryDialog?.openCreate()"
		@openEdit="categoryDialog?.openEdit"
		@confirmDelete="confirmDeleteCategory"
		@toggleSort="toggleCategorySort"
	/>
</VNavigationDrawer>

<VRow class="mt-lg-5 mt-md-3">
	<!-- Left panel: categories (desktop) -->
	<VCol cols="4" lg="3" class="d-none d-md-block">
		<VCard class="py-0">
			<TodoListCategoryPanel
				:categories :selectedCategoryId :categorySortAsc
				@selectCategory="selectCategory"
				@openCreate="categoryDialog?.openCreate()"
				@openEdit="categoryDialog?.openEdit"
				@confirmDelete="confirmDeleteCategory"
				@toggleSort="toggleCategorySort"
			/>
		</VCard>
	</VCol>

	<!-- Right panel: lists -->
	<VCol cols="12" md="8" lg="9">
		<div class="d-flex flex-column ga-2 mb-5">
			<div class="d-flex align-center ga-2">
				<VIconBtn icon="bars" density="comfortable" variant="tonal" class="d-md-none" @click="categoryDrawerOpen = true" />
				<VBtn color="primary" appendIcon="plus" @click="dialog?.openCreate(selectedCategoryIdForCreate)">{{
						$t('toDoList.namedList.add')
					}}
				</VBtn>
				<VSpacer/>
				<VIconBtn
					:icon="listSortAsc ? 'sort-alpha-down' : 'sort-alpha-up'"
					density="comfortable"
					variant="outlined"
					color="secondaryOutline"
					@click="toggleListSort"
					style="height: 40px; width: 40px;"
				/>
			</div>
			<VTextField
				v-model="listFilterName"
				:label="$t('general.search')"
				prependInnerIcon="magnifying-glass"
				density="compact"
				clearable
				hideDetails
			/>
		</div>

		<div class="d-flex flex-column ga-4">
			<VCard
				v-for="list in lists"
				:key="list.id"
				variant="outlined"
				class="pa-4 cursor-pointer"
				@click="router.push({ name: 'toDoListDetail', params: { id: list.id } })"
			>
				<div class="d-flex align-center ga-3">
					<VIcon v-if="list.icon" :icon="list.icon" size="26" color="primary"/>
					<div class="flex-grow-1">
						<div class="text-h6">{{ list.name }}</div>
						<div v-if="list.description" class="text-body-2 text-medium-emphasis mt-1">{{ list.description }}</div>
					</div>
					<div class="d-flex ga-2">
						<VIconBtn icon="pen" density="comfortable" color="secondaryOutline" variant="tonal" @click.stop="dialog?.openEdit(list)"/>
						<VIconBtn icon="trash" density="comfortable" color="default" variant="tonal" @click.stop="confirmDelete(list)"/>
					</div>
				</div>
			</VCard>
			<div v-if="lists.length === 0" class="text-center text-medium-emphasis py-6">
				{{ $t('toDoList.namedList.empty') }}
			</div>
		</div>
	</VCol>
</VRow>

<TodoListDialog ref="dialog" @add="add" @edit="edit"/>
<TodoListCategoryDialog ref="categoryDialog" @add="addCategory" @edit="editCategory"/>
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
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTodoListCategoryCrud} from '@/api/todoList/todoListCategoryApi.ts';
import {useTodoListCrud} from '@/api/todoList/todoListApi.ts';
import {TodoListEntity} from '@/dtos/response/todoList/TodoListEntity.ts';
import {TodoListRequest} from '@/dtos/request/todoList/TodoListRequest.ts';
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';
import {TodoListCategoryRequest} from '@/dtos/request/todoList/TodoListCategoryRequest.ts';
import TodoListDialog from '@/components/dialogs/toDoList/TodoListDialog.vue';
import TodoListCategoryDialog from '@/components/dialogs/toDoList/TodoListCategoryDialog.vue';
import TodoListCategoryPanel from '@/components/toDoList/TodoListCategoryPanel.vue';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const router = useRouter();
const i18n = useI18n();
const {showSuccessSnackbar} = useSnackbar();
const {createWithResponse, update, deleteEntity, fetchFilteredSorted} = useTodoListCrud();
const {
	fetchFilteredSorted: fetchCategories,
	createWithResponse: createCategory,
	update: updateCategory,
	deleteEntity: deleteCategoryEntity
} = useTodoListCategoryCrud();

const categories = ref([] as TodoListCategoryEntity[]);
const lists = ref([] as TodoListEntity[]);
const selectedCategoryId = ref<number | null>(null);
const categorySortAsc = ref(true);
const listFilterName = ref<string | null>(null);
const listSortAsc = ref(true);
const categoryDrawerOpen = ref(false);
const dialog = ref<InstanceType<typeof TodoListDialog>>();
const categoryDialog = ref<InstanceType<typeof TodoListCategoryDialog>>();
const deleteDialog = ref(false);
const listToDelete = ref<TodoListEntity | null>(null);
const deleteCategoryDialog = ref(false);
const categoryToDelete = ref<TodoListCategoryEntity | null>(null);

// null and -1 (Other) → no pre-selected category in dialog
const selectedCategoryIdForCreate = computed(() =>
	selectedCategoryId.value !== null && selectedCategoryId.value > 0 ? selectedCategoryId.value : null
);

onMounted(async () => {
	await Promise.all([loadCategories(), loadLists()]);
});

watch([listFilterName, listSortAsc], async () => {
	await loadLists();
});

async function loadCategories() {
	categories.value = await fetchCategories(categorySortAsc.value, null);
}

async function loadLists() {
	lists.value = await fetchFilteredSorted(listSortAsc.value, selectedCategoryId.value, listFilterName.value?.trim() || null);
}

async function selectCategory(id: number | null) {
	selectedCategoryId.value = id;
	await loadLists();
}

async function onMobileSelectCategory(id: number | null) {
	await selectCategory(id);
	categoryDrawerOpen.value = false;
}

async function toggleCategorySort() {
	categorySortAsc.value = !categorySortAsc.value;
	await loadCategories();
}

function toggleListSort() {
	listSortAsc.value = !listSortAsc.value;
}

async function add(request: TodoListRequest) {
	const created = await createWithResponse(request);
	lists.value.push(created);
	await loadCategories();
	showSuccessSnackbar(i18n.t('successFeedback.added'));
}

async function edit(id: number, request: TodoListRequest) {
	await update(id, request);
	await Promise.all([loadCategories(), loadLists()]);
	showSuccessSnackbar(i18n.t('successFeedback.edited'));
}

function confirmDelete(list: TodoListEntity) {
	listToDelete.value = list;
	deleteDialog.value = true;
}

async function deleteConfirmed() {
	if (!listToDelete.value) return;
	await deleteEntity(listToDelete.value.id);
	lists.value = lists.value.filter(l => l.id !== listToDelete.value!.id);
	listToDelete.value = null;
	await loadCategories();
	showSuccessSnackbar(i18n.t('successFeedback.deleted'));
}

async function addCategory(request: TodoListCategoryRequest) {
	request.color ??= 'default';
	await createCategory(request);
	await loadCategories();
	showSuccessSnackbar(i18n.t('successFeedback.added'));
}

async function editCategory(id: number, request: TodoListCategoryRequest) {
	await updateCategory(id, request);
	await loadCategories();
	showSuccessSnackbar(i18n.t('successFeedback.edited'));
}

function confirmDeleteCategory(category: TodoListCategoryEntity) {
	categoryToDelete.value = category;
	deleteCategoryDialog.value = true;
}

async function deleteCategoryConfirmed() {
	if (!categoryToDelete.value) return;
	await deleteCategoryEntity(categoryToDelete.value.id);
	if (selectedCategoryId.value === categoryToDelete.value.id) {
		selectedCategoryId.value = null;
		await loadLists();
	}
	categoryToDelete.value = null;
	await loadCategories();
	showSuccessSnackbar(i18n.t('successFeedback.deleted'));
}
</script>
