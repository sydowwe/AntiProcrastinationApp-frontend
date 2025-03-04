<template>
<MyDialog v-model="dialog" :title="title" :text="message" :persistent="true"
          :close-btn-text="$t('general.close')" @closed="emit('closed')"
          :has-confirm-btn="hasRetryButton" @confirmed="emit('retried')">
</MyDialog>
</template>
<script setup lang="ts">

import MyDialog from '@/components/dialogs/MyDialog.vue';

defineProps({
	title: {
		type: String,
		required: true,
		default: 'Error',
	},
	message: {
		type: String,
		required: true,
	},
	hasRetryButton: {
		type: Boolean,
		default: false,
	},
});
const dialog = defineModel<boolean>({required: true})
const emit = defineEmits(['closed', 'retried'])
</script>
