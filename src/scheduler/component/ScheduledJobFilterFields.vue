<template>
	<VTextField
		v-model="draft.ownerModule"
		:label="$t('scheduler.job.ownerModule')"
		hideDetails
	/>
	<VTextField
		v-model="draft.handlerKey"
		:label="$t('scheduler.job.handlerKey')"
		hideDetails
	/>
	<VSelect
		v-model="draft.status"
		:items="statusOptions"
		itemTitle="title"
		itemValue="value"
		:label="$t('scheduler.job.status')"
		density="comfortable"
		clearable
		hideDetails
	/>
	<VSelect
		v-model="draft.scheduleType"
		:items="scheduleTypeOptions"
		itemTitle="title"
		itemValue="value"
		:label="$t('scheduler.job.scheduleType')"
		density="comfortable"
		clearable
		hideDetails
	/>
	<VSelect
		v-model="draft.lastOutcome"
		:items="outcomeOptions"
		itemTitle="title"
		itemValue="value"
		:label="$t('scheduler.job.lastOutcome')"
		density="comfortable"
		clearable
		hideDetails
	/>
	<VDateInput
		v-model="draft.nextRunFrom"
		:label="$t('scheduler.job.nextRunFrom')"
		hideDetails
	/>
	<VDateInput
		v-model="draft.nextRunTo"
		:label="$t('scheduler.job.nextRunTo')"
		hideDetails
	/>
</template>

<script setup lang="ts">
	import { VDateInput } from 'vuetify/labs/components'
	import type { ScheduledJobFilter } from '@/core/scheduler/dto/request/ScheduledJobFilter.ts'
	import { JobStatus } from '@/core/scheduler/dto/enum/JobStatus.ts'
	import { ScheduleType } from '@/core/scheduler/dto/enum/ScheduleType.ts'
	import { RunOutcome } from '@/core/scheduler/dto/enum/RunOutcome.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'

	const { draft } = defineProps<{ draft: ScheduledJobFilter }>()

	const statusOptions = getEnumSelectOptions(JobStatus, 'scheduler.jobStatus')
	const scheduleTypeOptions = getEnumSelectOptions(ScheduleType, 'scheduler.scheduleType')
	const outcomeOptions = getEnumSelectOptions(RunOutcome, 'scheduler.runOutcome')
</script>
