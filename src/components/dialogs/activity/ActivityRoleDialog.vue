<template>
<MyDialog v-model="dialog" title="Add new role" :confirmBtnLabel="$t('general.create')"
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
import {Role} from '@/dtos/response/Role.ts';
import {RoleRequest} from '@/dtos/request/RoleRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useActivityRoleCrud} from '@/composables/ConcretesCrudComposable.ts';
import {VForm} from 'vuetify/components';

const {useApi} = defineProps({
	useApi: {
		type: Boolean,
		default: true
	}
})
const {create, update} = useActivityRoleCrud()
const {lettersWithDiacriticsAndSpecialCharsRule, requiredRule} = useGeneralRules()

const form = ref<InstanceType<typeof VForm>>();
const dialog = ref(false);
const request = ref(new RoleRequest());
const idToEdit = ref<number | null>(null);
const isEdit = ref(false);

function openAddDialog() {
	request.value = new RoleRequest();
	isEdit.value = false;
	dialog.value = true;
}

function openEditDialog(oldRole: Role) {
	idToEdit.value = oldRole.id;
	request.value = RoleRequest.fromEntity(oldRole);
	isEdit.value = true;
	dialog.value = true;
}

async function onConfirmed() {
	const {valid} = await form.value!.validate();
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
	form.value!.reset();
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