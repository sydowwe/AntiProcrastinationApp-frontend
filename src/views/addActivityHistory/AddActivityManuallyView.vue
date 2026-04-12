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
			<AddActivityManuallyForm
				ref="formRef"
				:initialActivityId
				:initialDateTime
				:initialLength
			></AddActivityManuallyForm>
			<div class="mt-8 w-100 text-center">
				<VBtn
					color="primary"
					@click="handleSave"
				>
					{{ i18n.t('history.recordActivityToHistory') }}
				</VBtn>
			</div>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import AddActivityManuallyForm from '@/components/addActivityToHistory/AddActivityManuallyForm.vue'
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import router from '@/plugins/router.ts'
	import { Time } from '@/dtos/dto/Time.ts'

	const i18n = useI18n()
	const formRef = ref<InstanceType<typeof AddActivityManuallyForm>>()

	const query = router.currentRoute.value.query

	const plannerTaskId = query.plannerTaskId as string | undefined
	const plannerDate = query.plannerDate as string | undefined
	const initialActivityId = query.activityId ? parseInt(query.activityId as string) : undefined
	const initialDateTime = query.startDateTime ? new Date(query.startDateTime as string) : undefined
	const initialLength = query.length ? Time.fromString(query.length as string) : undefined

	function handleSave() {
		if (plannerTaskId && plannerDate) {
			const values = formRef.value?.getValues()
			if (values?.dateTime && values.timeLength.isNotZero()) {
				router.push({
					name: 'dayPlanner',
					params: { date: plannerDate },
					query: {
						plannerTaskId,
						actualStartTime: Time.fromDate(values.dateTime).getString(),
						actualLength: values.timeLength.getString(),
					},
				})
			}
		} else {
			formRef.value?.saveActivity()
		}
	}
</script>
