<!-- LocationMatchChip.vue — marks a day template whose Suggested location is the day's own (OP18). -->
<template>
	<VChip
		size="x-small"
		variant="tonal"
		color="secondaryOutline"
		class="flex-shrink-0"
	>
		<VIcon
			:icon="LOCATION_ICONS[location]"
			size="12"
			class="mr-1"
		/>
		{{ t('planner.templateSuggestions.matchesLocation', { location: t(`planner.location.${location}`) }) }}
	</VChip>
</template>

<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { type Location, LOCATION_ICONS } from '@/core/dayPlanner/dto/enum/Location.ts'

	const { location } = defineProps<{
		location: Location
	}>()

	const { t } = useI18n()
</script>
