<template>
<div class="activity-summary-cards">
	<!-- Header Section -->
	<div class="d-flex justify-space-between align-center mb-4">
		<h2 class="text-h5">Top Domains</h2>
		<!-- Baseline Selector -->
		<div class="d-flex align-center ga-2">
			<span class="text-body-2 text-medium-emphasis">Compared to:</span>
			<VSelect
				:modelValue="selectedBaseline"
				:items="baselineOptions"
				itemValue="value"
				itemTitle="label"
				density="compact"
				variant="outlined"
				hideDetails
				@update:modelValue="handleBaselineChange"
				style="min-width: 170px;max-width: 170px;"
			/>
		</div>
	</div>

	<VDivider class="mb-4"/>

	<!-- Loading State -->
	<div v-if="loading" class="cards-grid">
		<VSkeletonLoader
			v-for="i in 5"
			:key="i"
			type="card"
			class="skeleton-card"
		/>
	</div>

	<!-- Empty State -->
	<div v-else-if="visibleDomains.length === 0" class="empty-state">
		<VIcon icon="fas fa-chart-column" size="64" class="text-disabled mb-4"/>
		<p class="text-body-1 text-medium-emphasis">
			No activity recorded for this period
		</p>
	</div>

	<!-- Domain Cards -->
	<div v-else class="cards-grid">
		<ActivityDomainCard
			v-for="domain in visibleDomains"
			:key="domain.domain"
			:domain="domain"
			@click="handleDomainClick"
		/>
	</div>
</div>
</template>

<script setup lang="ts">

import type {DomainSummary} from '@/components/activityTracking/summaryCards/dto/DomainSummary.ts';
import type {BaselineOption, BaselineType} from '@/components/activityTracking/summaryCards/dto/BaselineOption.ts';
import {computed} from 'vue';


const props = withDefaults(defineProps<{
	domains: DomainSummary[];
	baselineOptions: BaselineOption[];
	selectedBaseline: BaselineType;
	loading?: boolean;
}>(), {
	loading: false,
});

const emit = defineEmits<{
	(e: 'update:selectedBaseline', value: BaselineType): void;

	(e: 'domainClick', domain: string): void;
}>();

// Filter out domains with no activity (both active and background are 0 or null)
const visibleDomains = computed(() => {
	return props.domains.filter(domain => {
		const hasActiveTime = domain.active !== null && domain.active.seconds > 0;
		const hasBackgroundTime = domain.background !== null && domain.background.seconds > 0;
		return hasActiveTime || hasBackgroundTime;
	});
});

function handleBaselineChange(value: BaselineType) {
	emit('update:selectedBaseline', value);
}

function handleDomainClick(domain: string) {
	emit('domainClick', domain);
}
</script>

<style scoped>
.activity-summary-cards {
	width: 100%;
}

.cards-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	justify-content: flex-start;
}

.skeleton-card {
	min-width: 200px;
	max-width: 300px;
	height: 200px;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px 16px;
	text-align: center;
}

/* Responsive behavior */
@media (max-width: 960px) {
	.cards-grid {
		justify-content: center;
	}
}

@media (max-width: 600px) {
	.cards-grid {
		flex-direction: column;
		align-items: stretch;
	}

	.skeleton-card {
		max-width: 100%;
	}
}
</style>
