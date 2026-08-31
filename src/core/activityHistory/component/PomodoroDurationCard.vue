<template>
	<SubtleCard
		color="primary-accent"
		borderOpacity="high"
		class="d-flex align-center ga-3 pa-3"
	>
		<VSheet
			:color
			rounded="sm"
			width="4"
			height="36"
			class="flex-shrink-0"
		></VSheet>
		<span class="text-body-2 font-weight-medium flex-shrink-0">{{ label }}</span>
		<TimePicker
			v-model="model"
			label=""
			color="primaryOutline"
			viewMode="minute"
			hideDetails
		></TimePicker>
	</SubtleCard>
</template>
<script setup lang="ts">
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'

	defineProps<{
		color: string
		label: string
	}>()
	const model = defineModel<Time>({ required: true })
</script>
