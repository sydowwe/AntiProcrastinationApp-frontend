<template>
<MyDialog v-model="dialog" title="Add new category" :confirmBtnLabel="$t('general.create')"
          @confirmed="onConfirmed">
	<VForm ref="form" @submit.prevent="onConfirmed" class="d-flex flex-column ga-3">
		<VTextField label="Name" v-model="request.name" :rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"></VTextField>
		<VTextarea label="Text" v-model="request.text"></VTextarea>
		<VColorPicker label="Color" v-model="request.color" hide-inputs></VColorPicker>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {ref} from 'vue';
import {Category} from '@/dtos/response/Category.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useActivityCategoryCrud} from '@/composables/ConcretesCrudComposable.ts';
import {CategoryRequest} from '@/dtos/request/CategoryRequest.ts';
import type {VuetifyFormType} from '@/types/RefTypeInterfaces';

const {create, update} = useActivityCategoryCrud()
const {lettersWithDiacriticsAndSpecialCharsRule, requiredRule} = useGeneralRules()

const {useApi} = defineProps({
	useApi: {
		type: Boolean,
		default: true
	}
})

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const dialog = ref(false);
const request = ref(new CategoryRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);


function openAddDialog() {
	request.value = new CategoryRequest();
	isEdit.value = false;
	dialog.value = true;
}

function openEditDialog(oldCategory: Category) {
	request.value = CategoryRequest.fromEntity(oldCategory);
	isEdit.value = true;
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value.validate();
	if (!valid) return;
	if (isEdit.value) {
		if (useApi) {
			await update(idToEdit.value!, request.value);
		}
		emit('updated', idToEdit.value!, request.value);
	} else {
		if (useApi) {
			const createdId = await create(request.value);
			emit('created', request.value, createdId);
		}
		emit('create', request.value);
	}
	dialog.value = false;
	form.value.reset();
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