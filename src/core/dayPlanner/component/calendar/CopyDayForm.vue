<template>
	<div class="pt-2">
		<MyDateInput
			v-model="sourceDate"
			:label="$t('planner.calendar.sourceDateLabel')"
			:dateShowArrows="false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const dialogApi = useDialogApi<{ sourceDate: Date }>()

	const sourceDate = ref<Date>(new Date())

	dialogApi.onConfirm(onConfirm)

	function onConfirm() {
		dialogApi.close({ sourceDate: sourceDate.value })
	}
</script>
