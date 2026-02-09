<template>
<div class="home-view pa-4 w-100 h-100">
	<ActivityStackedBars
		:windows="mockWindows"
		:loading="loading"
		@windowSizeChange="handleWindowSizeChange"
		@activityClick="handleActivityClick"
	/>
</div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import ActivityStackedBars from '@/components/activityAnalytics/ActivityStackedBars.vue'
import {generateMockActivityWindows} from '@/components/activityAnalytics/mockData'
import type {ActivityWindow} from '@/dtos/response/activityTracking/ActivityWindow'

const loading = ref(false)
const mockWindows = ref(generateMockActivityWindows())

function handleWindowSizeChange(size: number) {
	console.log('Window size changed to:', size)
	// In a real app, you'd fetch new data with the new window size
}

function handleActivityClick(window: ActivityWindow, domain: string) {
	console.log('Activity clicked:', {window, domain})
	// In a real app, you might show a detail modal or navigate to a detail page
}
</script>

<style scoped>
</style>