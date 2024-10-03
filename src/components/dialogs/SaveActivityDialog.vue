<template>
<MyDialog v-model="dialog" title="Record new activity" @closed="close" @confirmed="saveActivity"
          text="Confirm saving activity - <i>{{ activity }}</i> done for {{ timeSpent }} ?"
>
</MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';

//TODO preklad
const i18n = useI18n();
const activity = ref('sitting around');
const timeSpent = ref('0s');
const dialog = ref(false);

function open(_activity: string, _timeSpent: string) {
	activity.value = _activity ?? activity.value;
	timeSpent.value = _timeSpent;
	dialog.value = true;
}

function close() {
	dialog.value = false;
	emit('resetTime');
}

function saveActivity() {
	emit('saved');
	close();
}

const emit = defineEmits(['saved', 'resetTime']);
defineExpose({open});
</script>
