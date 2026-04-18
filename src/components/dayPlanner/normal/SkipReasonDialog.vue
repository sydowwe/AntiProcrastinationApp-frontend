<template>
	<MyDialog
		v-model="model"
		title="Skip task"
		confirmBtnText="Skip"
		confirmBtnColor="warning"
		@confirmed="handleConfirm"
	>
		<VTextarea
			v-model="reason"
			label="Reason (optional)"
			rows="3"
			autoGrow
			hideDetails
			class="mt-2"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'

	const emit = defineEmits<{
		skip: [reason: string]
	}>()

	const model = defineModel<boolean>({ default: false })

	const reason = ref('')

	watch(model, open => {
		if (open) reason.value = ''
	})

	function handleConfirm() {
		emit('skip', reason.value)
		model.value = false
	}
</script>
