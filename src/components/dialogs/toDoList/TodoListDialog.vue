<template>
<MyDialog v-model="dialog" @confirmed="save" :title="isEdit ? $t('general.edit') : $t('toDoList.namedList.add')"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')">
	<VForm class="py-3 mb-1 d-flex flex-column ga-8" ref="form" @submit.prevent="save" validateOn="invalid-input">
		<VTextField
			v-model="request.name"
			:label="$t('general.name')"
			:rules="[requiredRule]"
			required
			style="margin-bottom: -20px;"
		/>
		<IconPicker v-model="request.icon"/>
		<VIdSelect
			v-model="request.categoryId"
			:label="$t('toDoList.namedList.category')"
			:items="categoryOptions"
			hideDetails
		/>
		<VTextarea
			v-model="request.description"
			:label="$t('toDoList.namedList.description')"
			rows="3"
			hideDetails
		/>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {VForm} from 'vuetify/components';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {TodoListRequest} from '@/dtos/request/todoList/TodoListRequest.ts';
import {TodoListEntity} from '@/dtos/response/todoList/TodoListEntity.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import IconPicker from '@/components/general/inputs/IconPicker.vue';
import {useTodoListCategoryCrud} from '@/api/ConcretesCrudComposable.ts';
import type {SelectOption} from '@/dtos/response/general/SelectOption.ts';

const {requiredRule} = useGeneralRules()
const {fetchSelectOptions} = useTodoListCategoryCrud()

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const request = ref(new TodoListRequest(''));
const categoryOptions = ref([] as SelectOption[]);

onMounted(async () => {
	categoryOptions.value = await fetchSelectOptions();
})

const emit = defineEmits<{
	(e: 'add', request: TodoListRequest): void
	(e: 'edit', id: number, request: TodoListRequest): void
}>()

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid?.valid) return
	if (isEdit.value && editId.value !== null) {
		emit('edit', editId.value, request.value)
	} else {
		emit('add', request.value)
	}
	close()
}

function openCreate(initialCategoryId: number | null = null) {
	isEdit.value = false;
	editId.value = null;
	request.value = new TodoListRequest('', null, null, initialCategoryId);
	dialog.value = true;
}

function openEdit(entity: TodoListEntity) {
	isEdit.value = true;
	editId.value = entity.id;
	request.value = new TodoListRequest(entity.name, entity.icon, entity.description, entity.category?.id ?? null);
	dialog.value = true;
}

function close() {
	dialog.value = false;
	request.value = new TodoListRequest('');
	isEdit.value = false;
	editId.value = null;
}

defineExpose({openCreate, openEdit, close})
</script>
