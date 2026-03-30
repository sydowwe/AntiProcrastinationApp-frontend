<template>
	<MyDialog
		v-model="dialog"
		:title="title"
		:text="message"
		:persistent="true"
		:closeBtnText="$t('general.close')"
		:hasConfirmBtn="hasRetryButton"
		@closed="emit('closed')"
		@confirmed="emit('retried')"
	></MyDialog>
</template>
<script setup lang="ts">
	import MyDialog from '@/components/dialogs/MyDialog.vue'

	withDefaults(
		defineProps<{
			title: string
			message: string
			hasRetryButton?: boolean
		}>(),
		{ hasRetryButton: false },
	)
	const emit = defineEmits<{
		closed: []
		retried: []
	}>()
	const dialog = defineModel<boolean>({ required: true })
</script>
