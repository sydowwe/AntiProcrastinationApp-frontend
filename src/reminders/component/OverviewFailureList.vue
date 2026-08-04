<template>
	<VCard class="d-flex flex-column pa-4 flex-grow-1">
		<div class="d-flex align-center ga-3 mb-3">
			<VIcon
				icon="triangle-exclamation"
				:color="isEmpty ? 'textMuted' : 'error'"
				size="26"
			/>
			<div class="flex-grow-1">
				<div class="text-subtitle-1 font-weight-medium">
					{{ $t('reminderDashboard.overview.failuresTitle') }}
				</div>
				<div class="text-caption text-medium-emphasis">
					{{ $t('reminderDashboard.overview.failuresSubtitle') }}
				</div>
			</div>
			<div
				class="text-h5 font-weight-bold"
				:class="isEmpty ? 'text-medium-emphasis' : 'text-error'"
			>
				{{ items.length }}
			</div>
		</div>

		<div
			v-if="isEmpty"
			class="d-flex align-center ga-2 text-medium-emphasis py-3"
		>
			<VIcon
				icon="circle-check"
				size="18"
				color="success"
			/>
			<span class="text-body-2">{{ $t('reminderDashboard.overview.noFailures') }}</span>
		</div>

		<div
			v-else
			v-auto-animate
		>
			<RouterLink
				v-for="item in items"
				:key="item.id"
				class="failure-row d-flex flex-column ga-1 py-2 px-2 rounded"
				:to="{ name: 'reminderDispatchHistory', query: { reminderId: item.reminderId } }"
			>
				<div class="d-flex align-center justify-space-between ga-2">
					<span class="text-body-2 font-weight-medium text-truncate">{{ item.kind }}</span>
					<span class="text-caption text-no-wrap text-medium-emphasis">{{ item.ownerModule }}</span>
				</div>
				<div class="d-flex align-center justify-space-between ga-2">
					<span
						v-if="item.detail"
						class="text-caption text-error text-truncate"
					>
						{{ item.detail }}
					</span>
					<span class="text-caption text-no-wrap text-medium-emphasis">
						{{ formatInstant(item.dispatchedAt) }}
					</span>
				</div>
			</RouterLink>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import type { FailedDispatchItem } from '@/core/reminders/dto/response/ReminderOverviewResponse.ts'

	const { items } = defineProps<{ items: FailedDispatchItem[] }>()

	const { formatInstant } = useReminderFormat()
	const isEmpty = computed(() => items.length === 0)
</script>

<style scoped>
	.failure-row {
		color: inherit;
		text-decoration: none;
		transition: background-color 0.15s ease;
	}

	.failure-row:hover {
		background-color: rgba(var(--v-theme-on-surface), 0.06);
	}
</style>
