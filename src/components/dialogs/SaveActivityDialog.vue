<template>
<MyDialog v-model="dialog" title="Record new activity" @closed="close" @confirmed="saveActivity">
	<span class="text-center">
		Confirm saving activity "{{ activity }}" - done for {{ timeSpent?.getNice }} ?
	</span>
</MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import type {Time} from '@/classes/TimeUtils.ts';

//TODO preklad
const i18n = useI18n();
const activity = ref('sitting around');
const timeSpent = ref<Time>();
const dialog = ref(false);

function open(_activity: string, _timeSpent: Time) {
	activity.value = _activity ?? activity.value;
	timeSpent.value = _timeSpent;
	dialog.value = true;
}

function close() {
	dialog.value = false;
	emit('resetTime');
}

function saveActivity() {
	emit('saved', timeSpent.value!);
	close();
}

const emit = defineEmits<{
	(e: 'saved', length: Time): void;
	(e: 'resetTime'): void;
}>();
defineExpose({open});
</script>
