<template>
<VRow class="mt-lg-5 mt-md-3">
	<!-- Left panel: categories -->
	<VCol cols="4" lg="3">
		<VCard class="px-3 pt-3 pb-2">
			<div class="d-flex align-center justify-space-between px-4 mb-2">
				<div class="d-flex align-center ga-4">
					<span class="text-subtitle-1 font-weight-medium flex-grow-1">{{ $t('toDoList.namedList.categories') }}</span>
					<VIconBtn
						icon="plus"
						density="comfortable"
						color="success"
						variant="tonal"
						@click="categoryDialog?.openCreate()"
					/>
				</div>
				<VIconBtn
					:icon="categorySortAsc ? 'sort-alpha-down' : 'sort-alpha-up'"
					density="comfortable"
					variant="tonal"
					@click="toggleCategorySort"
				/>
			</div>
			<VList density="comfortable" style="--v-activated-opacity: 0">
				<VListItem
					class="pl-3 py-2"
					:variant="selectedCategoryId === null ? 'outlined' : 'text'"
					:style="selectedCategoryId === null ? { borderColor: 'rgb(var(--v-theme-primary))' } : {}"
					prependIcon="list"
					:title="$t('general.all')"
					rounded="lg"
					@click="selectCategory(null)"
				/>
				<VListItem
					class="pr-2 pl-3 py-2"
					v-for="cat in categories"
					:key="cat.id"
					:variant="selectedCategoryId === cat.id ? 'outlined' : 'text'"
					:style="selectedCategoryId === cat.id ? { borderColor: 'rgb(var(--v-theme-primary))' } : {}"
					:prependIcon="cat.icon ?? undefined"
					:title="cat.name"
					rounded="lg"
					@click="selectCategory(cat.id)"
				>
					<template v-if="cat.id !== -1" #append>
						<div class="d-flex ga-2">
							<VIconBtn icon="pen" density="comfortable" variant="tonal" color="secondaryOutline" @click.stop="categoryDialog?.openEdit(cat)">
								<VIcon size="16"></VIcon>
							</VIconBtn>
							<VIconBtn icon="trash" density="comfortable" variant="tonal" color="default" @click.stop="confirmDeleteCategory(cat)">
								<VIcon size="16"></VIcon>
							</VIconBtn>
						</div>
					</template>
				</VListItem>
			</VList>
		</VCard>
	</VCol>

	<!-- Right panel: lists -->
	<VCol cols="8" lg="9">
		<div class="d-flex justify-space-between align-center mb-5">
			<VBtn color="primary" appendIcon="plus" @click="dialog?.openCreate(selectedCategoryIdForCreate)">{{ $t('toDoList.namedList.add') }}</VBtn>
			<VTextField
				v-model="listFilterName"
				:label="$t('general.search')"
				prependInnerIcon="magnifying-glass"
				density="compact"
				clearable
				hideDetails
				max-width="500"
			/>
			<VIconBtn
				:icon="listSortAsc ? 'sort-alpha-down' : 'sort-alpha-up'"
				density="comfortable"
				variant="outlined"
				color="secondaryOutline"
				@click="toggleListSort"
				style="height: 40px; width: 40px; align-self: center"
			/>
		</div>

		<div v-autoAnimate class="d-flex flex-column ga-4">
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
						<VIconBtn icon="pen" density="comfortable" color="secondaryOutline" variant="tonal" @click.stop="dialog?.openEdit(list)">
							<VIcon size="20"></VIcon>
						</VIconBtn>
						<VIconBtn icon="trash" density="comfortable" color="default" variant="tonal" @click.stop="confirmDelete(list)">
							<VIcon size="20"></VIcon>
						</VIconBtn>
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
import {useTodoListCategoryCrud, useTodoListCrud} from '@/api/ConcretesCrudComposable.ts';
import {TodoListEntity} from '@/dtos/response/todoList/TodoListEntity.ts';
import {TodoListRequest} from '@/dtos/request/todoList/TodoListRequest.ts';
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';
import {TodoListCategoryRequest} from '@/dtos/request/todoList/TodoListCategoryRequest.ts';
import TodoListDialog from '@/components/dialogs/toDoList/TodoListDialog.vue';
import TodoListCategoryDialog from '@/components/dialogs/toDoList/TodoListCategoryDialog.vue';
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
