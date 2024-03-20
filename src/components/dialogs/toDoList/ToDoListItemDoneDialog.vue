<template>
<v-dialog v-model="dialog" max-width="600">
	<v-card class="px-6 py-4 text-center">
		<v-card-title class="pa-0 text-wrap" v-html="i18n.t('toDoList.saveToHistory',{task: taskName})"></v-card-title>
		<v-card-text class="px-0 pb-0">
			<VForm @keyup.native.enter="save">
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.date') }}</VLabel>
					<MyDatePicker class="ml-2 flex-grow-1" :clearable="false"></MyDatePicker>
				</div>
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.time') }}</VLabel>
					<TimePicker class="ml-2 flex-grow-1"></TimePicker>
				</div>
				<div class="d-flex flex-column flex-sm-row mb-4">
					<VLabel>{{ i18n.t('dateTime.length') }}</VLabel>
					<TimeLengthPicker class="ml-2 flex-grow-1"></TimeLengthPicker>
				</div>
			</VForm>
		</v-card-text>
		<v-card-actions class="justify-end px-0">
			<v-btn color="red" @click="close">{{ i18n.t('general.cancel') }}</v-btn>
			<v-btn color="green" @click="save">{{ i18n.t('general.save') }}</v-btn>
		</v-card-actions>
	</v-card>
</v-dialog>
</template>
<script setup lang="ts">
import {ref, watch, defineProps} from 'vue';
import {importDefaults} from '@/compositions/Defaults';
import MyDatePicker from '@/components/MyDatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import TimeLengthPicker from '@/components/TimeLengthPicker.vue';

const {i18n, showErrorSnackbar} = importDefaults();
const props = defineProps({
	parentViewName: {
		type: String,
		required: true,
	},
	taskName: {
		type: String,
		required: true,
	},
});
const dialog = ref(false);


function save() {

	dialog.value = false;
}

function close() {
	dialog.value = false;
}

function open() {
	dialog.value = true;
}
const emit = defineEmits<{
	saved: []
}>();
defineExpose({
	open, close
})
</script>

<style scoped>

</style>