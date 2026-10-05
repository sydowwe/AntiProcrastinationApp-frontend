<template>
	<VCard
		class="domain-card domain-card--clickable"
		:class="{ 'domain-card--selected': selected }"
		:elevation="selected ? 6 : 2"
		tabindex="0"
		role="button"
		:aria-label="$t('activityTracking.statColumn.viewDetails', { domain: withRecordedBy(name, domain.sources) })"
		:data-key="domain.key"
		@click="handleClick"
		@keydown.enter="handleClick"
		@keydown.space.prevent="handleClick"
	>
		<VCardTitle class="text-center pb-2">
			<VTooltip
				:text="name"
				location="top"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="domain-name"
					>
						{{ name }}
					</div>
				</template>
			</VTooltip>
			<!-- Unified cards only: which trackers saw the item, the same icons as the source filter. -->
			<VTooltip
				v-if="domain.sources.length > 0"
				:text="$t('activityTracking.sources.recordedByList', { sources: sourcesText(domain.sources) })"
				location="bottom"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="d-flex justify-center ga-2 mt-1 text-medium-emphasis"
						data-testid="summary-card-sources"
					>
						<VIcon
							v-for="source in domain.sources"
							:key="source"
							:icon="sourceIcon(source)"
							size="12"
						/>
					</div>
				</template>
			</VTooltip>
		</VCardTitle>
		<VCardText
			class="pa-0"
			style="background-color: rgb(55, 55, 55)"
		>
			<div class="stat-columns">
				<template v-if="showActive && showBackground">
					<ActivityStatColumn
						:label="$t('activityTracking.viewMode.active')"
						:seconds="domain.active!.seconds"
						:averageSeconds="domain.active!.averageSeconds"
						:percentChange="domain.active!.percentChange"
						:isNew="domain.isNew"
					/>
					<VDivider vertical />
					<ActivityStatColumn
						:label="$t('activityTracking.viewMode.background')"
						:seconds="domain.background!.seconds"
						:averageSeconds="domain.background!.averageSeconds"
						:percentChange="domain.background!.percentChange"
						:isNew="domain.isNew"
					/>
				</template>
				<template v-else-if="showActive">
					<ActivityStatColumn
						:label="$t('activityTracking.viewMode.active')"
						:seconds="domain.active!.seconds"
						:averageSeconds="domain.active!.averageSeconds"
						:percentChange="domain.active!.percentChange"
						:isNew="domain.isNew"
						class="single-column"
					/>
				</template>
				<template v-else-if="showBackground">
					<ActivityStatColumn
						:label="$t('activityTracking.viewMode.background')"
						:seconds="domain.background!.seconds"
						:averageSeconds="domain.background!.averageSeconds"
						:percentChange="domain.background!.percentChange"
						:isNew="domain.isNew"
						class="single-column"
					/>
				</template>
			</div>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ActivityStatColumn from './ActivityStatColumn.vue'
	import type { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
	import { useActivitySources } from '@/core/activityTracking/composable/useActivitySources.ts'

	const props = defineProps<{
		domain: SummaryCardsData
		/** The label as disambiguated among its sibling cards (`distinctLabels`); `domain.label` if absent. */
		displayName?: string
		selected?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'click', key: string): void
	}>()

	const { sourceIcon, sourcesText, withRecordedBy } = useActivitySources()

	const name = computed(() => props.displayName ?? props.domain.label)

	const showActive = computed(() => props.domain.active !== null && props.domain.active.seconds > 0)
	const showBackground = computed(() => props.domain.background !== null && props.domain.background.seconds > 0)

	function handleClick() {
		emit('click', props.domain.key)
	}
</script>

<style scoped>
	.domain-card {
		min-width: 200px;
		max-width: 300px;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.domain-card--clickable {
		cursor: pointer;
	}

	.domain-card--clickable:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
	}

	.domain-card--clickable:focus {
		outline: 2px solid rgb(var(--v-theme-primary));
		outline-offset: 2px;
	}

	.domain-card--selected {
		border: 2px solid rgb(var(--v-theme-primary));
	}

	.domain-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.stat-columns {
		display: flex;
		justify-content: space-evenly;
		align-items: center;
	}

	.single-column {
		flex: 1;
		display: flex;
		justify-content: center;
	}
</style>
