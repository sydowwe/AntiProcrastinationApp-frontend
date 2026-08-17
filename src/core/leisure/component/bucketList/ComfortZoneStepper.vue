<template>
	<div class="d-flex align-center ga-2">
		<span class="text-body-2">{{ label }}</span>
		<div class="d-flex ga-1">
			<VBtn
				v-for="step in 5"
				:key="step"
				:color="step <= model ? comfortZoneColor(step) : 'grey-lighten-2'"
				:variant="step <= model ? 'elevated' : 'tonal'"
				size="small"
				icon
				@click="model = step"
			>
				{{ step }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { comfortZoneColor } from '@/core/leisure/component/bucketList/comfortZoneColor.ts'

	const { label = '' } = defineProps<{ label?: string }>()
	const model = defineModel<number>({ required: true })
</script>
