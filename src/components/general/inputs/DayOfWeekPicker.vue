<template>
	<VBtnToggle
		v-model="model"
		multiple
		density="compact"
		color="secondaryOutline"
		variant="tonal"
		divided
	>
		<VBtn
			v-for="day in dayOfWeekOptions"
			:key="day.value"
			:value="day.value"
			size="small"
		>
			{{ day.label }}
		</VBtn>
	</VBtnToggle>
</template>

<script setup lang="ts">
	import type { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
	import { dayOfWeekOptions } from '@/dtos/enum/dayOptions.ts'

	const model = defineModel<DayOfWeek[]>({ default: [] })
</script>
