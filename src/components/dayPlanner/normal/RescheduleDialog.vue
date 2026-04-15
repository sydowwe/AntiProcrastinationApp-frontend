<template>
	<MyDialog
		v-model="model"
		title="Reschedule tasks"
		confirmBtnText="Reschedule"
		@confirmed="handleConfirm"
	>
		<div class="d-flex justify-center pt-2">
			<MyDateInput
				v-model="targetDate"
				:dateShowArrows="false"
			/>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import MyDateInput from '@/components/general/dateTime/MyDateInput.vue'

	const model = defineModel<boolean>({ default: false })

	const emit = defineEmits<{
		reschedule: [date: Date]
	}>()

	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	const targetDate = ref<Date>(tomorrow)

	function handleConfirm() {
		emit('reschedule', targetDate.value)
		model.value = false
	}
</script>
