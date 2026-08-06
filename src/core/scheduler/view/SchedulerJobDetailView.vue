<template>
	<VContainer
		fluid
		class="d-flex flex-column ga-4"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between flex-wrap ga-3">
				<VBtn
					variant="text"
					prependIcon="arrow-left"
					:to="{ name: 'schedulerJobs' }"
				>
					{{ $t('general.backToList') }}
				</VBtn>
				<div
					v-if="job"
					class="d-flex align-center ga-3 flex-wrap"
				>
					<JobStatusChip :status="job.status" />
					<ChipWithIcon
						v-if="job.isOrphaned"
						icon="link-slash"
						color="error"
						size="small"
					>
						{{ $t('scheduler.job.orphaned') }}
					</ChipWithIcon>
					<span class="text-h5 font-monospace">{{ job.jobKey }}</span>
				</div>
				<JobActionButtons
					v-if="job"
					:jobId="job.id"
					:status="job.status"
					:isOrphaned="job.isOrphaned"
					@triggered="onTriggered"
					@statusChanged="loadJob"
				/>
			</div>

			<VAlert
				v-if="job?.isOrphaned"
				type="error"
				variant="tonal"
				:title="$t('scheduler.job.orphanedTitle')"
				:text="$t('scheduler.job.orphanedText')"
			/>

			<VCard
				v-if="job"
				rounded="lg"
				class="pa-4"
			>
				<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('scheduler.job.detailTitle') }}</div>
				<div class="job-info-grid">
					<InfoRow
						:label="$t('scheduler.job.jobKey')"
						:value="job.jobKey"
					/>
					<InfoRow :label="$t('scheduler.job.description')">
						<span class="info-row__value">{{ job.description ?? '—' }}</span>
					</InfoRow>
					<InfoRow
						:label="$t('scheduler.job.ownerModule')"
						:value="job.ownerModule"
					/>
					<InfoRow
						:label="$t('scheduler.job.handlerKey')"
						:value="job.handlerKey"
					/>
					<InfoRow :label="$t('scheduler.job.schedule')">
						<ScheduleDisplay
							:scheduleType="job.scheduleType"
							:cronExpression="job.cronExpression"
							:intervalValue="job.intervalValue"
							:intervalUnit="job.intervalUnit"
						/>
					</InfoRow>
					<InfoRow :label="$t('scheduler.job.lastRun')">
						<div
							v-if="job.lastRunAt"
							class="d-flex align-center ga-2"
						>
							<RunOutcomeChip :outcome="job.lastOutcome" />
							<span>{{ formatDateTime(job.lastRunAt) }}</span>
						</div>
						<span
							v-else
							class="info-row__value text-medium-emphasis"
						>
							{{ $t('scheduler.job.neverRun') }}
						</span>
					</InfoRow>
					<InfoRow :label="$t('scheduler.job.nextRun')">
						<span class="info-row__value">
							<template v-if="job.nextRunAt">{{ formatDateTime(job.nextRunAt) }}</template>
							<span
								v-else
								class="text-medium-emphasis"
							>
								{{ $t('scheduler.job.noNextRun') }}
							</span>
						</span>
					</InfoRow>
					<InfoRow :label="$t('scheduler.job.overdueState')">
						<ChipWithIcon
							v-if="job.isOverdue"
							icon="clock"
							color="error"
							size="small"
						>
							{{ $t('scheduler.job.overdue') }}
						</ChipWithIcon>
						<span
							v-else
							class="info-row__value text-medium-emphasis"
						>
							{{ $t('scheduler.job.onSchedule') }}
						</span>
					</InfoRow>
				</div>
			</VCard>

			<VCard
				v-if="job"
				rounded="lg"
				class="pa-4"
			>
				<JobRunHistory
					ref="runHistory"
					:jobId="job.id"
					:jobKey="job.jobKey"
				/>
			</VCard>

			<div
				v-else-if="loading"
				class="d-flex justify-center pa-8"
			>
				<VProgressCircular
					indeterminate
					color="primary"
				/>
			</div>

			<VAlert
				v-else
				type="error"
				variant="tonal"
				:title="$t('scheduler.job.notFoundTitle')"
				:text="$t('scheduler.job.notFoundText')"
			/>
		</template>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import JobStatusChip from '@/core/scheduler/component/JobStatusChip.vue'
	import RunOutcomeChip from '@/core/scheduler/component/RunOutcomeChip.vue'
	import ScheduleDisplay from '@/core/scheduler/component/ScheduleDisplay.vue'
	import JobActionButtons from '@/core/scheduler/component/JobActionButtons.vue'
	import JobRunHistory from '@/core/scheduler/component/JobRunHistory.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'
	import type { ScheduledJobResponse } from '@/core/scheduler/dto/response/ScheduledJobResponse.ts'
	import { useScheduledJobQuery } from '@/core/scheduler/api/SchedulerApi.ts'
	import { useSchedulerFormat } from '@/core/scheduler/composable/useSchedulerFormat.ts'
	import { useSetBreadcrumbExtra } from '@/_common/composable/general/useBreadcrumbs.ts'
	import { useAuth } from '@/_common/auth/authAdapter.ts'

	const { id } = defineProps<{ id: string }>()

	const i18n = useI18n()
	const auth = useAuth()
	const { formatDateTime } = useSchedulerFormat()
	const { fetchById } = useScheduledJobQuery()

	const isAdmin = computed(() => auth.isAdminRole())
	const loading = ref(false)
	const job = ref<ScheduledJobResponse | null>(null)
	const runHistory = ref<InstanceType<typeof JobRunHistory>>()

	async function loadJob() {
		loading.value = true
		try {
			job.value = await fetchById(Number(id))
		} catch {
			// The axios interceptor already surfaces the error; clear stale data so the not-found card shows.
			job.value = null
		} finally {
			loading.value = false
		}
	}

	function onTriggered() {
		// The manual run runs in the background — refresh the history so it shows up once written.
		runHistory.value?.reload()
	}

	// The jobs list is not a nav path, so supply its crumb explicitly.
	const jobsCrumb = { title: i18n.t('navigation.schedulerJobs'), to: '/planovac/ulohy' }
	const { setBreadcrumbExtra } = useSetBreadcrumbExtra()
	watch(job, value => {
		setBreadcrumbExtra(value ? [jobsCrumb, { title: value.jobKey }] : [jobsCrumb])
	})

	onMounted(loadJob)
</script>

<style scoped>
	.job-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}
</style>
