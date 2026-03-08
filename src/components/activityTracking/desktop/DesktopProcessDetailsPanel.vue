<template>
<VCard variant="outlined">
	<VCardTitle class="d-flex align-center justify-space-between">
		<span>{{ details.productName }}</span>
		<VBtn
			icon="fas fa-xmark"
			variant="text"
			size="small"
			density="compact"
			@click="emit('close')"
		/>
	</VCardTitle>

	<VDivider/>

	<VCardText>
		<div class="details-grid">
			<div class="detail-row">
				<span class="text-medium-emphasis">Total:</span>
				<span class="font-weight-medium">{{ formatDuration(details.totalSeconds) }}</span>
			</div>
			<div class="detail-row">
				<span class="text-medium-emphasis">Active:</span>
				<span>{{ formatDuration(details.activeSeconds) }}</span>
			</div>
			<div class="detail-row">
				<span class="text-medium-emphasis">Background:</span>
				<span>{{ formatDuration(details.backgroundSeconds) }}</span>
			</div>
			<template v-if="details.fullscreenSeconds > 0">
				<div class="detail-row">
					<span class="text-medium-emphasis">Fullscreen:</span>
					<span>{{ formatDuration(details.fullscreenSeconds) }}</span>
				</div>
			</template>
			<template v-if="details.soundSeconds > 0">
				<div class="detail-row">
					<span class="text-medium-emphasis">Playing sound:</span>
					<span>{{ formatDuration(details.soundSeconds) }}</span>
				</div>
			</template>
			<div class="detail-row">
				<span class="text-medium-emphasis">Entries:</span>
				<span>{{ details.entries }}</span>
			</div>
		</div>

		<template v-if="details.monitorBreakdown.length > 1">
			<VDivider class="my-3"/>
			<div class="text-subtitle-2 text-medium-emphasis mb-2">Monitor breakdown:</div>
			<div class="details-grid">
				<div v-for="m in details.monitorBreakdown" :key="m.monitor" class="detail-row">
					<span class="text-medium-emphasis">Monitor {{ m.monitor }}:</span>
					<span>{{ formatDuration(m.activeSeconds) }}</span>
				</div>
			</div>
		</template>

		<template v-if="details.windowTitles.length > 0">
			<VDivider class="my-3"/>
			<div class="text-subtitle-2 text-medium-emphasis mb-2">Window titles:</div>
			<VList density="compact" class="py-0">
				<VListItem
					v-for="(wt, i) in visibleWindowTitles"
					:key="i"
					class="px-0"
				>
					<template #title>
						<div class="d-flex justify-space-between align-center ga-2">
							<span class="window-title-text">{{ wt.windowTitle }}</span>
							<span class="text-medium-emphasis text-caption flex-shrink-0">{{ formatDuration(wt.totalSeconds) }}</span>
						</div>
					</template>
				</VListItem>
			</VList>
			<VBtn
				v-if="details.windowTitles.length > maxVisible"
				variant="text"
				size="small"
				class="mt-1"
				@click="expanded = !expanded"
			>
				{{ expanded ? '- Show less' : `+ ${details.windowTitles.length - maxVisible} more` }}
			</VBtn>
		</template>
	</VCardText>
</VCard>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {formatDuration} from '@/utils/formatDuration'
import type {DesktopProcessDetailsResponse} from '@/dtos/response/activityTracking/desktop/DesktopProcessDetailsResponse.ts'

const props = defineProps<{
	details: DesktopProcessDetailsResponse
}>()

const emit = defineEmits<{
	close: []
}>()

const expanded = ref(false)
const maxVisible = 5

const visibleWindowTitles = computed(() =>
	expanded.value ? props.details.windowTitles : props.details.windowTitles.slice(0, maxVisible)
)
</script>

<style scoped>
.details-grid {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.window-title-text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 12px;
}
</style>
