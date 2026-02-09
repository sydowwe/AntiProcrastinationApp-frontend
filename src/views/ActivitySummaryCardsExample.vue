<template>
<VContainer>
	<ActivitySummaryCards
		:domains="domains"
		:baselineOptions="baselineOptions"
		:selectedBaseline="selectedBaseline"
		:loading="loading"
		@update:selectedBaseline="handleBaselineChange"
		@domainClick="handleDomainClick"
	/>
</VContainer>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {BaselineOption, BaselineType} from '@/components/activityTracking/summaryCards/BaselineSelector.vue';
import type {DomainSummary} from '@/components/activityTracking/summaryCards/ActivityDomainCard.vue';
import ActivitySummaryCards from '@/components/activityTracking/summaryCards/ActivitySummaryCards.vue';

const loading = ref(false);
const selectedBaseline = ref<BaselineType>('last7days');

const baselineOptions: BaselineOption[] = [
	{value: 'last7days', label: 'Last 7 days'},
	{value: 'last30days', label: 'Last 30 days'},
	{value: 'sameWeekday', label: 'Same weekday'},
	{value: 'allTime', label: 'All time'},
];

const domains = ref<DomainSummary[]>([
	{
		domain: 'github.com',
		active: {
			seconds: 6300, // 1h 45m
			averageSeconds: 5625,
			percentChange: 12,
		},
		background: {
			seconds: 1500, // 25m
			averageSeconds: 1630,
			percentChange: -8,
		},
		isNew: false,
	},
	{
		domain: 'claude.ai',
		active: {
			seconds: 5400, // 1h 30m
			averageSeconds: 5670,
			percentChange: -5,
		},
		background: null, // User disabled background tracking
		isNew: false,
	},
	{
		domain: 'youtube.com',
		active: {
			seconds: 900, // 15m
			averageSeconds: null,
			percentChange: null,
		},
		background: {
			seconds: 7800, // 2h 10m
			averageSeconds: null,
			percentChange: null,
		},
		isNew: true, // No historical data
	},
	{
		domain: 'stackoverflow.com',
		active: null, // User disabled active tracking
		background: {
			seconds: 3600, // 1h
			averageSeconds: 3600,
			percentChange: 0,
		},
		isNew: false,
	},
	{
		domain: 'verylongdomainnamethatshouldbetruncat.com',
		active: {
			seconds: 2700, // 45m
			averageSeconds: 2000,
			percentChange: 35,
		},
		background: {
			seconds: 600, // 10m
			averageSeconds: 800,
			percentChange: -25,
		},
		isNew: false,
	},
]);

function handleBaselineChange(baseline: BaselineType) {
	selectedBaseline.value = baseline;
	console.log('Baseline changed to:', baseline);
	// In real app, this would trigger data refetch
}

function handleDomainClick(domain: string) {
	console.log('Domain clicked:', domain);
	// In real app, this might highlight the domain in a pie chart or navigate to details
}
</script>

<style scoped>
</style>
