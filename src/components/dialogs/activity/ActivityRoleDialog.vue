<template>
<MyDialog v-model="dialog" title="Add new role" :confirmBtnLabel="$t('general.create')"
          @confirmed="onConfirmed">
	<v-text-field label="Name" v-model="request.name" :rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"></v-text-field>
	<VTextarea label="Text" v-model="request.text"></VTextarea>
	<VColorPicker label="Color" v-model="request.color" hide-inputs></VColorPicker>
</MyDialog>
</template>

<script setup lang="ts">
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {ref} from 'vue';
import {Role} from '@/dtos/response/Role.ts';
import {RoleRequest} from '@/dtos/request/RoleRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useActivityRoleCrud} from '@/composables/ConcretesCrudComposable.ts';

const {useApi} = defineProps({
	useApi: {
		type: Boolean,
		default: true
	}
})
const {create, update} = useActivityRoleCrud()
const {lettersWithDiacriticsAndSpecialCharsRule, requiredRule} = useGeneralRules()

const dialog = ref(false);
const request = ref(new RoleRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);

function openAddDialog() {
	request.value = new RoleRequest();
	dialog.value = true;
	isEdit.value = false;
}

function openEditDialog(oldRole: Role) {
	idToEdit.value = oldRole.id;
	request.value = RoleRequest.fromResponse(oldRole);
	dialog.value = true;
	isEdit.value = true;
}

async function onConfirmed() {
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
	request.value = new RoleRequest();
	idToEdit.value = null;
	isEdit.value = false;
}

const emit = defineEmits<{
	(e: 'created', newItem: RoleRequest, createdId: number): void;
	(e: 'create', newItem: RoleRequest): void;
	(e: 'updated', updatedId: number, updatedItem: RoleRequest): void;
}>()
defineExpose({openAddDialog, openEditDialog})
</script>

<style scoped>

</style>