<template>
<MyDialog v-model="dialog" :title="isEdit ? 'Edit Activity' : 'Create Activity'" :isSmall="false"
          hasCloseBtn hasConfirmBtn :confirmBtnLabel="isEdit ? 'Save' : 'Create'"
          @confirmed="validateAndSendForm" @closed="onClose">
	<NewActivityForm ref="activityForm" v-model="request"/>
</MyDialog>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import NewActivityForm from '@/components/activity/NewActivityForm.vue';
import {Activity} from '@/dtos/response/activity/Activity.ts';
import {ActivityRequest} from '@/dtos/request/activity/ActivityRequest.ts';
import {useActivityCrud} from '@/api/ConcretesCrudComposable.ts';

const {create, update} = useActivityCrud();

const activityForm = ref<InstanceType<typeof NewActivityForm>>();
const dialog = ref(false);
const isEdit = ref(false);
const idToEdit = ref<number | null>(null);
const request = ref(new ActivityRequest());

const emit = defineEmits<{
	created: [request: ActivityRequest, createdId: number]
	updated: [id: number, request: ActivityRequest]
}>();

async function openAddDialog(roleId?: number, categoryId?: number) {
	request.value = new ActivityRequest();
	isEdit.value = false;
	idToEdit.value = null;
	dialog.value = true;
	if (roleId) {
		request.value.roleId = roleId;
	}
	if (categoryId) {
		request.value.categoryId = categoryId;
	}
}

async function openEditDialog(activity: Activity) {
	request.value = new ActivityRequest(activity.name, activity.text, activity.role.id, activity.category?.id ?? null, activity.isUnavoidable);
	isEdit.value = true;
	idToEdit.value = activity.id;
	dialog.value = true;
}

async function validateAndSendForm() {
	const {valid} = await activityForm.value!.validate();
	if (!valid) return;
	if (isEdit.value) {
		await update(idToEdit.value!, request.value);
		emit('updated', idToEdit.value!, request.value);
	} else {
		const createdId = await create(request.value);
		emit('created', request.value, createdId);
	}
	dialog.value = false;
	reset();
}

function onClose() {
	reset();
}

function reset() {
	activityForm.value?.reset();
	request.value = new ActivityRequest();
	idToEdit.value = null;
	isEdit.value = false;
}

defineExpose({openAddDialog, openEditDialog});
</script>
