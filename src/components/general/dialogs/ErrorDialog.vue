<template>
	<MyDialog
		v-model="dialog"
		:title="title"
		:text="message"
		persistent
		:closeBtnText="$t('general.close')"
		:hasConfirmBtn="hasRetryButton"
		@closed="emit('closed')"
		@confirmed="emit('retried')"
	></MyDialog>
</template>
<script setup lang="ts">
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'

	const { hasRetryButton = false } = defineProps<{
		title: string
		message: string
		hasRetryButton?: boolean
	}>()
	const emit = defineEmits<{
		closed: []
		retried: []
	}>()
	const dialog = defineModel<boolean>({ required: true })
</script>
