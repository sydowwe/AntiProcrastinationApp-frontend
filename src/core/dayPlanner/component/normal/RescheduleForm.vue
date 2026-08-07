<template>
	<div class="d-flex justify-center pt-2">
		<MyDateInput
			v-model="targetDate"
			:dateShowArrows="false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const dialogApi = useDialogApi<{ date: Date }>()

	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	const targetDate = ref<Date>(tomorrow)

	dialogApi.onConfirm(onConfirm)

	function onConfirm() {
		dialogApi.close({ date: targetDate.value })
	}
</script>
