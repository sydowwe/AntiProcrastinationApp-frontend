<template>
	<div class="d-flex flex-column align-center justify-center ga-3 py-8 px-4 text-center">
		<span class="text-body-2 text-textMuted">
			{{ isFiltered ? (filteredExplanation ?? t('activities.noResultsForFilter')) : explanation }}
		</span>
		<VBtn
			v-if="!isFiltered"
			color="success"
			prependIcon="plus"
			size="small"
			@click="emit('create')"
		>
			{{ createLabel }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import { useI18n } from 'vue-i18n'

	/**
	 * What the three activity-settings tables show instead of a blank grid.
	 *
	 * A first-run account sees all three of them empty and has no way to tell what the app means by
	 * "role" or "category", so the empty table is the one place worth explaining the entity. A table
	 * emptied by a filter is a different situation entirely and gets no lecture and no create button —
	 * the thing to do there is change the filter.
	 */
	defineProps<{
		/** One sentence saying what this entity is for. Shown only when nothing exists at all. */
		explanation: string
		isFiltered: boolean
		createLabel: string
		/**
		 * Replaces the generic "nothing matches the filter" line for a filter that deserves its own
		 * answer — the archived view, where "no results" is true but the useful sentence is that nothing
		 * has been archived yet.
		 */
		filteredExplanation?: string
	}>()

	const emit = defineEmits<{
		create: []
	}>()

	const { t } = useI18n()
</script>
