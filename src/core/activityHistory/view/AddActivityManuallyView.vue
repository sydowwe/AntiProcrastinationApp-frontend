<template>
	<VRow
		class="py-4"
		justify="center"
		align="center"
	>
		<VCol
			cols="12"
			sm="10"
			md="10"
			lg="10"
			xl="6"
			class="mt-3 mt-md-0"
		>
			<AddActivityManuallyForm ref="formRef"></AddActivityManuallyForm>
			<div class="mt-8 w-100 text-center">
				<VBtn
					color="primary"
					:loading="saving"
					@click="handleSave"
				>
					{{ i18n.t('history.recordActivityToHistory') }}
				</VBtn>
			</div>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import AddActivityManuallyForm from '@/core/activityHistory/component/AddActivityManuallyForm.vue'
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'

	const i18n = useI18n()
	const formRef = ref<InstanceType<typeof AddActivityManuallyForm>>()
	const saving = ref(false)

	// Re-entry guard: a second click inside the round trip would POST the same (activity, start)
	// and come back 409 (F68).
	async function handleSave() {
		if (saving.value) return
		saving.value = true
		try {
			await formRef.value?.saveActivity()
		} finally {
			saving.value = false
		}
	}
</script>
