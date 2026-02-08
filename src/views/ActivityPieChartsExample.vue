<template>
<div class="pa-4">
	<h1 class="text-h4 mb-6">Activity Summary Example</h1>

	<ActivityPieChartSection
		:domains="mockDomains"
		:dayTotals="mockDayTotals"
		:loading="loading"
		:otherThresholdPercent="3"
		@domainSelect="handleDomainSelect"
	/>

	<div class="mt-4">
		<VBtn @click="toggleLoading">
			Toggle Loading
		</VBtn>
	</div>
</div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import ActivityPieChartSection from '../components/activityPieChart/ActivityPieChartSection.vue'

const loading = ref(false)
const selectedDomain = ref<string | null>(null)

// Mock data for demonstration
const mockDomains = ref([
	{
		domain: 'github.com',
		activeSeconds: 6300, // 1h 45m
		backgroundSeconds: 1500, // 25m
		totalSeconds: 7800, // 2h 10m
		entries: 23,
		pages: [
			{url: 'https://github.com/user/repo/pulls', seconds: 2700},
			{url: 'https://github.com/user/repo/issues', seconds: 1920},
			{url: 'https://github.com/notifications', seconds: 1080},
			{url: 'https://github.com/explore', seconds: 720},
			{url: 'https://github.com/settings', seconds: 380},
		],
	},
	{
		domain: 'stackoverflow.com',
		activeSeconds: 3600, // 1h
		backgroundSeconds: 900, // 15m
		totalSeconds: 4500, // 1h 15m
		entries: 15,
		pages: [
			{url: 'https://stackoverflow.com/questions/12345', seconds: 1800},
			{url: 'https://stackoverflow.com/questions/67890', seconds: 1200},
			{url: 'https://stackoverflow.com/users/profile', seconds: 900},
			{url: 'https://stackoverflow.com/questions/tagged/vue', seconds: 600},
		],
	},
	{
		domain: 'docs.vuetifyjs.com',
		activeSeconds: 2400, // 40m
		backgroundSeconds: 600, // 10m
		totalSeconds: 3000, // 50m
		entries: 12,
		pages: [
			{url: 'https://docs.vuetifyjs.com/components/cards', seconds: 1200},
			{url: 'https://docs.vuetifyjs.com/components/buttons', seconds: 900},
			{url: 'https://docs.vuetifyjs.com/getting-started', seconds: 900},
		],
	},
	{
		domain: 'developer.mozilla.org',
		activeSeconds: 1800, // 30m
		backgroundSeconds: 300, // 5m
		totalSeconds: 2100, // 35m
		entries: 8,
		pages: [
			{url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', seconds: 1200},
			{url: 'https://developer.mozilla.org/en-US/docs/Web/API', seconds: 900},
		],
	},
	{
		domain: 'youtube.com',
		activeSeconds: 600, // 10m
		backgroundSeconds: 2400, // 40m
		totalSeconds: 3000, // 50m
		entries: 5,
		pages: [
			{url: 'https://youtube.com/watch?v=abc123', seconds: 2400},
			{url: 'https://youtube.com/watch?v=def456', seconds: 600},
		],
	},
	{
		domain: 'reddit.com',
		activeSeconds: 900, // 15m
		backgroundSeconds: 300, // 5m
		totalSeconds: 1200, // 20m
		entries: 10,
		pages: [
			{url: 'https://reddit.com/r/programming', seconds: 600},
			{url: 'https://reddit.com/r/webdev', seconds: 400},
			{url: 'https://reddit.com/r/vuejs', seconds: 200},
		],
	},
	// Small domains that will be grouped into "Other"
	{
		domain: 'twitter.com',
		activeSeconds: 180, // 3m
		backgroundSeconds: 120, // 2m
		totalSeconds: 300, // 5m
		entries: 3,
		pages: [{url: 'https://twitter.com/home', seconds: 300}],
	},
	{
		domain: 'linkedin.com',
		activeSeconds: 240, // 4m
		backgroundSeconds: 60, // 1m
		totalSeconds: 300, // 5m
		entries: 2,
		pages: [{url: 'https://linkedin.com/feed', seconds: 300}],
	},
	{
		domain: 'gmail.com',
		activeSeconds: 120, // 2m
		backgroundSeconds: 180, // 3m
		totalSeconds: 300, // 5m
		entries: 4,
		pages: [{url: 'https://gmail.com/mail/u/0', seconds: 300}],
	},
])

const mockDayTotals = ref({
	totalSeconds: 19920, // 5h 32m
	activeSeconds: 15000, // 4h 10m
	backgroundSeconds: 4920, // 1h 22m
	totalDomains: 9,
	totalPages: 22,
	totalVisits: 82,
})

function handleDomainSelect(domain: string | null) {
	selectedDomain.value = domain
	console.log('Selected domain:', domain)
}

function toggleLoading() {
	loading.value = !loading.value
}
</script>
