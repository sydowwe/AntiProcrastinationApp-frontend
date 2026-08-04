<template>
	<VContainer
		fluid
		class="d-flex flex-column ga-4"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between flex-wrap ga-3">
				<div class="d-flex align-center ga-3">
					<VBtn
						variant="text"
						prependIcon="arrow-left"
						:to="{ name: 'reminderUpcoming' }"
					>
						{{ $t('reminderDashboard.overview.backToUpcoming') }}
					</VBtn>
					<h1 class="text-h5">{{ $t('reminderDashboard.overview.title') }}</h1>
				</div>
				<VBtn
					variant="text"
					color="primaryOutline"
					prependIcon="rotate"
					:loading
					@click="load"
				>
					{{ $t('reminderDashboard.overview.refresh') }}
				</VBtn>
			</div>

			<div
				v-if="loading && data === null"
				class="d-flex justify-center py-12"
			>
				<VProgressCircular
					indeterminate
					color="primary"
					size="48"
				/>
			</div>

			<template v-else-if="data">
				<!-- Headline counts -->
				<div class="d-flex flex-wrap ga-4">
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 200px; flex-basis: 200px"
					>
						<VIcon
							icon="clock"
							color="primary"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">
								{{ $t('reminderDashboard.overview.dueSoon', { days: data.dueSoonDays }) }}
							</div>
							<div class="text-h4 font-weight-bold text-primary">{{ data.dueSoonCount }}</div>
						</div>
					</VCard>
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 200px; flex-basis: 200px"
					>
						<VIcon
							icon="circle-pause"
							color="warning"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">{{ $t('reminders.status.Paused') }}</div>
							<div class="text-h4 font-weight-bold text-warning">{{ data.pausedCount }}</div>
						</div>
					</VCard>
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 200px; flex-basis: 200px"
					>
						<VIcon
							icon="circle-xmark"
							color="textMuted"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">{{ $t('reminders.status.Cancelled') }}</div>
							<div class="text-h4 font-weight-bold text-medium-emphasis">{{ data.cancelledCount }}</div>
						</div>
					</VCard>
				</div>

				<!-- Recent dispatch outcomes (last week) -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">
						{{ $t('reminderDashboard.overview.recentOutcomes') }}
					</div>
					<div
						v-if="data.recentOutcomes.total > 0"
						class="d-flex flex-wrap ga-3"
					>
						<ChipWithIcon
							icon="circle-check"
							color="success"
						>
							{{ $t('reminderDashboard.outcome.Sent') }}: {{ data.recentOutcomes.sent }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="forward"
							color="textMuted"
						>
							{{ $t('reminderDashboard.outcome.Skipped') }}: {{ data.recentOutcomes.skipped }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="circle-exclamation"
							color="error"
						>
							{{ $t('reminderDashboard.outcome.Failed') }}: {{ data.recentOutcomes.failed }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="rotate-left"
							color="warning"
						>
							{{ $t('reminderDashboard.outcome.Reversal') }}: {{ data.recentOutcomes.reversed }}
						</ChipWithIcon>
					</div>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('reminderDashboard.overview.noRecentDispatches') }}
					</span>
				</VCard>

				<!-- Upcoming volume rollups -->
				<div class="d-flex flex-wrap ga-4">
					<OverviewGroupCard
						:title="$t('reminderDashboard.overview.byOwnerModule')"
						icon="cube"
						:groups="data.upcomingByOwnerModule"
					/>
					<OverviewGroupCard
						:title="$t('reminderDashboard.overview.byKind')"
						icon="bell"
						:groups="data.upcomingByKind"
					/>
				</div>

				<!-- Failures needing attention -->
				<OverviewFailureList :items="data.failures" />
			</template>
		</template>

		<VCard
			v-else
			class="pa-6 text-center"
		>
			<p class="text-error">{{ $t('general.forbidden') }}</p>
		</VCard>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import OverviewFailureList from '@/core/reminders/component/OverviewFailureList.vue'
	import OverviewGroupCard from '@/core/reminders/component/OverviewGroupCard.vue'
	import type { ReminderOverviewResponse } from '@/core/reminders/dto/response/ReminderOverviewResponse.ts'
	import { fetchReminderOverview } from '@/core/reminders/api/ReminderDashboardApi.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'

	const authStore = useAuthStore()
	const isAdmin = computed(() => authStore.isAdminRole())

	const loading = ref(false)
	const data = ref<ReminderOverviewResponse | null>(null)

	async function load() {
		if (!isAdmin.value || loading.value) return
		loading.value = true
		try {
			data.value = await fetchReminderOverview()
		} catch {
			// Error snackbars are owned by the axios interceptor.
		} finally {
			loading.value = false
		}
	}

	onMounted(load)
</script>
