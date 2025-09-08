<template>
<MyDialog v-model="dialog" title="Add new category" :confirmBtnLabel="$t('general.create')"
          @confirmed="onConfirmed">
	<v-text-field label="Name" v-model="request.name" :rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"></v-text-field>
	<VTextarea label="Text" v-model="request.text"></VTextarea>
	<VColorPicker label="Color" v-model="request.color" hide-inputs></VColorPicker>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {ref} from 'vue';
import {Category, CategoryRequest} from '@/classes/Category.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {RoleRequest} from '@/classes/Role.ts';
import {useActivityCategoryCrud, useActivityRoleCrud} from '@/composables/ConcretesCrudComposable.ts';

const {create, update} = useActivityCategoryCrud()
const {lettersWithDiacriticsAndSpecialCharsRule, requiredRule} = useGeneralRules()

const {useApi} = defineProps({
	useApi: {
		type: Boolean,
		default: true
	}
})

const dialog = ref(false);
const request = ref(new CategoryRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);

function openAddDialog(){
	request.value = new CategoryRequest();
	dialog.value = true;
	isEdit.value = false;
}

function openEditDialog(oldCategory: Category){
	request.value = CategoryRequest.fromResponse(oldCategory);
	dialog.value = true;
	isEdit.value = true;
}

async function onConfirmed() {
	if (isEdit.value) {
		if (useApi){
			await update(idToEdit.value!, request.value);
		}
		emit('updated', idToEdit.value!, request.value);
	}else{
		if (useApi){
			const createdId = await create(request.value);
			emit('created', request.value, createdId);
		}
		emit('create', request.value);
	}
	dialog.value = false;
	request.value = new CategoryRequest();
	idToEdit.value = null;
	isEdit.value = false;
}

const emit = defineEmits<{
	(e: 'created', newItem: CategoryRequest, createdId: number): void;
	(e: 'create', newItem: CategoryRequest): void;
	(e: 'updated', updatedId: number, updatedItem: CategoryRequest): void;
}>()
defineExpose({openAddDialog, openEditDialog})
</script>

<style scoped>

</style>