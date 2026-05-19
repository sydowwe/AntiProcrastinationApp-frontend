<template>
	<div class="pt-2">
		<MyDateInput
			v-model="sourceDate"
			label="Source date"
			:dateShowArrows="false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDateInput from '@/components/general/dateTime/MyDateInput.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'

	const dialogApi = useDialogApi<{ sourceDate: Date }>()

	const sourceDate = ref<Date>(new Date())

	dialogApi.onConfirm(onConfirm)

	function onConfirm() {
		dialogApi.close({ sourceDate: sourceDate.value })
	}
</script>
