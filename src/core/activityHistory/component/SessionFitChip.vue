<!-- F2-07: one tap sets the timer to the length that usually works for this activity (`useSessionFit`). -->
<template>
	<VTooltip
		location="top"
		:text="$t('history.sessionFit.tooltip')"
	>
		<template #activator="{ props: tooltipProps }">
			<VChip
				v-bind="tooltipProps"
				role="button"
				variant="tonal"
				color="primaryOutline"
				prependIcon="hourglass-half"
				@click="emit('apply', length)"
			>
				{{ $t('history.sessionFit.try', { time: length.getNice }) }}
			</VChip>
		</template>
	</VTooltip>
</template>
<script setup lang="ts">
	import type { Time } from '@/_common/dto/dto/Time.ts'

	const { length } = defineProps<{
		length: Time
	}>()

	const emit = defineEmits<{
		apply: [length: Time]
	}>()
</script>
