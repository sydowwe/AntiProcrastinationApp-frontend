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
						:to="{ name: 'schedulerJobs' }"
					>
						{{ $t('scheduler.needsAttention.backToJobs') }}
					</VBtn>
					<h1 class="text-h5">{{ $t('scheduler.needsAttention.title') }}</h1>
				</div>
				<VBtn
					variant="text"
					color="primaryOutline"
					prependIcon="rotate"
					:loading
					@click="load"
				>
					{{ $t('scheduler.needsAttention.refresh') }}
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

			<VAlert
				v-else-if="loadFailed && data === null"
				type="error"
				variant="tonal"
				:text="$t('scheduler.needsAttention.loadError')"
			/>

			<template v-else-if="data">
				<!-- Status counts -->
				<div class="d-flex flex-wrap ga-4">
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 180px; flex-basis: 180px"
					>
						<VIcon
							icon="circle-play"
							color="success"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">{{ $t('scheduler.jobStatus.Active') }}</div>
							<div class="text-h4 font-weight-bold text-success">{{ data.activeCount }}</div>
						</div>
					</VCard>
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 180px; flex-basis: 180px"
					>
						<VIcon
							icon="circle-pause"
							color="warning"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">{{ $t('scheduler.jobStatus.Paused') }}</div>
							<div class="text-h4 font-weight-bold text-warning">{{ data.pausedCount }}</div>
						</div>
					</VCard>
					<VCard
						class="flex-grow-1 pa-4 d-flex align-center ga-3"
						style="min-width: 180px; flex-basis: 180px"
					>
						<VIcon
							icon="circle-xmark"
							color="textMuted"
							size="28"
						/>
						<div>
							<div class="text-caption text-medium-emphasis">{{ $t('scheduler.jobStatus.Removed') }}</div>
							<div class="text-h4 font-weight-bold text-medium-emphasis">{{ data.removedCount }}</div>
						</div>
					</VCard>
				</div>

				<!-- Recent outcomes rollup (last day) -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">
						{{ $t('scheduler.needsAttention.recentOutcomes') }}
					</div>
					<div
						v-if="data.recentOutcomes.total > 0"
						class="d-flex flex-wrap ga-3"
					>
						<ChipWithIcon
							icon="circle-check"
							color="success"
						>
							{{ $t('scheduler.runOutcome.Succeeded') }}: {{ data.recentOutcomes.succeeded }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="circle-exclamation"
							color="error"
						>
							{{ $t('scheduler.runOutcome.Failed') }}: {{ data.recentOutcomes.failed }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="forward"
							color="textMuted"
						>
							{{ $t('scheduler.runOutcome.Skipped') }}: {{ data.recentOutcomes.skipped }}
						</ChipWithIcon>
						<ChipWithIcon
							icon="ban"
							color="warning"
						>
							{{ $t('scheduler.runOutcome.Vetoed') }}: {{ data.recentOutcomes.vetoed }}
						</ChipWithIcon>
					</div>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('scheduler.needsAttention.noRecentRuns') }}
					</span>
				</VCard>

				<!-- All clear -->
				<VCard
					v-if="allClear"
					class="pa-10 text-center"
				>
					<VIcon
						icon="mug-hot"
						color="success"
						size="56"
						class="mb-3"
					/>
					<p class="text-h6">{{ $t('scheduler.needsAttention.allClearTitle') }}</p>
					<p class="text-body-2 text-medium-emphasis">{{ $t('scheduler.needsAttention.allClearText') }}</p>
				</VCard>

				<!-- Attention lists -->
				<div
					v-else
					class="d-flex flex-wrap ga-4"
				>
					<AttentionJobList
						:title="$t('scheduler.needsAttention.failed')"
						:subtitle="$t('scheduler.needsAttention.failedSubtitle')"
						icon="circle-exclamation"
						color="error"
						:items="data.failedJobs"
					/>
					<AttentionJobList
						:title="$t('scheduler.needsAttention.overdue')"
						:subtitle="$t('scheduler.needsAttention.overdueSubtitle')"
						icon="clock"
						color="error"
						:items="data.overdueJobs"
					/>
					<AttentionJobList
						:title="$t('scheduler.needsAttention.orphaned')"
						:subtitle="$t('scheduler.needsAttention.orphanedSubtitle')"
						icon="link-slash"
						color="warning"
						:items="data.orphanedJobs"
					/>
				</div>
			</template>
		</template>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import AttentionJobList from '@/core/scheduler/component/AttentionJobList.vue'
	import type { SchedulerNeedsAttentionResponse } from '@/core/scheduler/dto/response/SchedulerNeedsAttentionResponse.ts'
	import { fetchSchedulerNeedsAttention } from '@/core/scheduler/api/SchedulerApi.ts'
	import { useAuth } from '@/_common/auth/authAdapter.ts'

	const auth = useAuth()
	const isAdmin = computed(() => auth.isAdminRole())

	const loading = ref(false)
	const loadFailed = ref(false)
	const data = ref<SchedulerNeedsAttentionResponse | null>(null)

	const allClear = computed(() => {
		const d = data.value
		if (d === null) return false
		return d.failedJobs.length === 0 && d.overdueJobs.length === 0 && d.orphanedJobs.length === 0
	})

	async function load() {
		if (!isAdmin.value || loading.value) return
		loading.value = true
		loadFailed.value = false
		try {
			data.value = await fetchSchedulerNeedsAttention()
		} catch {
			loadFailed.value = true
		} finally {
			loading.value = false
		}
	}

	onMounted(load)
</script>
