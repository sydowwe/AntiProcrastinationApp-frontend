<template>
	<VCard variant="outlined">
		<VCardTitle class="d-flex align-center justify-space-between">
			<span>{{ headerText }}</span>
			<VBtn
				v-if="mode === 'domain'"
				icon="mdi-close"
				variant="text"
				size="small"
				density="compact"
				aria-label="Close domain details"
				@click="emit('close')"
			/>
		</VCardTitle>

		<VDivider />

		<VCardText>
			<template v-if="mode === 'dayTotal' && dayTotals">
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">Total time:</span>
						<span class="text-high-emphasis font-weight-medium">
							{{ formatDuration(dayTotals.totalSeconds) }}
						</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Active:</span>
						<span>{{ formatDuration(dayTotals.activeSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Background:</span>
						<span>{{ formatDuration(dayTotals.backgroundSeconds) }}</span>
					</div>

					<VDivider class="my-3" />

					<div class="detail-row">
						<span class="text-medium-emphasis">Domains:</span>
						<span>{{ dayTotals.totalDomains }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Pages:</span>
						<span>{{ dayTotals.totalPages }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Visits:</span>
						<span>{{ dayTotals.totalVisits ?? '-' }}</span>
					</div>
				</div>
			</template>

			<template v-else-if="mode === 'domain' && domainDetails">
				<div class="details-grid">
					<div class="detail-row">
						<span class="text-medium-emphasis">Total:</span>
						<span class="text-high-emphasis font-weight-medium">
							{{ formatDuration(domainDetails.totalSeconds) }}
						</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Active:</span>
						<span>{{ formatDuration(domainDetails.activeSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Background:</span>
						<span>{{ formatDuration(domainDetails.backgroundSeconds) }}</span>
					</div>

					<div class="detail-row">
						<span class="text-medium-emphasis">Entries:</span>
						<span>{{ domainDetails.entries }}</span>
					</div>
				</div>

				<VDivider class="my-4" />

				<DomainDetailsList :pages="domainDetails.pages" />
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '@/utils/formatDuration'
import DomainDetailsList from './DomainDetailsList.vue'

interface DayTotals {
	totalSeconds: number
	activeSeconds: number
	backgroundSeconds: number
	totalDomains: number
	totalPages: number
	totalVisits?: number
}

interface PageVisit {
	url: string
	seconds: number
}

interface DomainDetails {
	domain: string
	totalSeconds: number
	activeSeconds: number
	backgroundSeconds: number
	entries: number
	pages: PageVisit[]
}

const props = defineProps<{
	mode: 'dayTotal' | 'domain'
	dayTotals: DayTotals | null
	domainDetails: DomainDetails | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
}>()

const headerText = computed(() => {
	if (props.mode === 'dayTotal') {
		return 'Day Total'
	} else if (props.domainDetails) {
		return props.domainDetails.domain
	}
	return 'Details'
})
</script>

<style scoped>
.details-grid {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
