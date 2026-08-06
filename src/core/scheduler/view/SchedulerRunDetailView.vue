<template>
	<VContainer
		fluid
		class="d-flex flex-column ga-4"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between flex-wrap ga-3">
				<VBtn
					v-if="run"
					variant="text"
					prependIcon="arrow-left"
					:to="{ name: 'schedulerJobDetail', params: { id: run.jobId } }"
				>
					{{ $t('scheduler.run.backToJob') }}
				</VBtn>
				<VBtn
					v-else
					variant="text"
					prependIcon="arrow-left"
					:to="{ name: 'schedulerJobs' }"
				>
					{{ $t('general.backToList') }}
				</VBtn>

				<div
					v-if="run"
					class="d-flex align-center ga-3 flex-wrap"
				>
					<RunOutcomeChip :outcome="run.outcome" />
					<TriggerSourceChip :source="run.triggerSource" />
					<span class="text-h5">{{ $t('scheduler.run.runNumber', { id: run.id }) }}</span>
				</div>

				<VBtn
					v-if="run"
					color="warningDark"
					prependIcon="rotate-right"
					@click="replayDialog = true"
				>
					{{ $t('scheduler.actions.replay') }}
				</VBtn>
			</div>

			<template v-if="run">
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('scheduler.run.detailTitle') }}</div>
					<div class="run-info-grid">
						<InfoRow :label="$t('scheduler.run.jobKey')">
							<RouterLink
								class="text-info text-decoration-none"
								:to="{ name: 'schedulerJobDetail', params: { id: run.jobId } }"
							>
								{{ run.jobKey }}
							</RouterLink>
						</InfoRow>
						<InfoRow :label="$t('scheduler.run.outcome')">
							<RunOutcomeChip :outcome="run.outcome" />
						</InfoRow>
						<InfoRow :label="$t('scheduler.run.triggerSource')">
							<TriggerSourceChip :source="run.triggerSource" />
						</InfoRow>
						<InfoRow
							:label="$t('scheduler.run.scheduledFireTime')"
							:value="run.scheduledFireTime ? formatDateTime(run.scheduledFireTime) : '—'"
						/>
						<InfoRow
							:label="$t('scheduler.run.actualFireTime')"
							:value="run.actualFireTime ? formatDateTime(run.actualFireTime) : '—'"
						/>
						<InfoRow
							:label="$t('scheduler.run.startedAt')"
							:value="formatDateTime(run.startedAt)"
						/>
						<InfoRow
							:label="$t('scheduler.run.finishedAt')"
							:value="run.finishedAt ? formatDateTime(run.finishedAt) : '—'"
						/>
						<InfoRow
							:label="$t('scheduler.run.duration')"
							:value="formatRunDuration(run.durationSeconds)"
						/>
						<InfoRow :label="$t('scheduler.run.correlationId')">
							<code class="run-correlation">{{ run.correlationId || '—' }}</code>
						</InfoRow>
					</div>
				</VCard>

				<VAlert
					v-if="run.outcome === RunOutcome.Failed && (run.errorType || run.errorMessage)"
					type="error"
					variant="tonal"
				>
					<div class="font-weight-medium">{{ run.errorType ?? $t('scheduler.run.error') }}</div>
					<div
						v-if="run.errorMessage"
						class="text-body-2 mt-1"
						style="white-space: pre-wrap"
					>
						{{ run.errorMessage }}
					</div>
				</VAlert>

				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="d-flex align-center ga-2 mb-2">
						<span class="text-subtitle-1 font-weight-medium">
							{{ $t('scheduler.run.payloadSnapshot') }}
						</span>
						<VIcon
							icon="circle-info"
							size="14"
							class="text-medium-emphasis"
							:title="$t('scheduler.run.payloadHint')"
						/>
					</div>
					<pre
						v-if="run.payloadSnapshot"
						class="run-payload"
						>{{ prettyPayload }}</pre
					>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('scheduler.run.noPayload') }}
					</span>
				</VCard>

				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('scheduler.run.replayLineage') }}</div>

					<InfoRow
						class="mb-3"
						:label="$t('scheduler.run.replayedFrom')"
					>
						<RouterLink
							v-if="run.replayedFromRunId !== null"
							class="text-info text-decoration-none"
							:to="{ name: 'schedulerRunDetail', params: { id: run.replayedFromRunId } }"
						>
							{{ $t('scheduler.run.runNumber', { id: run.replayedFromRunId }) }}
						</RouterLink>
						<span
							v-else
							class="info-row__value text-medium-emphasis"
						>
							{{ $t('scheduler.run.notAReplay') }}
						</span>
					</InfoRow>

					<div class="text-caption text-medium-emphasis mb-1">{{ $t('scheduler.run.replaysOfThis') }}</div>
					<VList
						v-if="run.replayRuns.length > 0"
						density="compact"
					>
						<VListItem
							v-for="child in run.replayRuns"
							:key="child.id"
							:to="{ name: 'schedulerRunDetail', params: { id: child.id } }"
						>
							<template #prepend>
								<RunOutcomeChip :outcome="child.outcome" />
							</template>
							<VListItemTitle class="ml-2">
								{{ $t('scheduler.run.runNumber', { id: child.id }) }} ·
								{{ formatDateTime(child.startedAt) }}
							</VListItemTitle>
						</VListItem>
					</VList>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('scheduler.run.noReplays') }}
					</span>
				</VCard>
			</template>

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
				:title="$t('scheduler.run.notFoundTitle')"
				:text="$t('scheduler.run.notFoundText')"
			/>

			<ReplayConfirmDialog
				v-model="replayDialog"
				:runId="run?.id ?? null"
				:jobKey="run?.jobKey ?? null"
				:loading="replaying"
				@confirmed="confirmReplay"
			/>
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
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
	import RunOutcomeChip from '@/core/scheduler/component/RunOutcomeChip.vue'
	import TriggerSourceChip from '@/core/scheduler/component/TriggerSourceChip.vue'
	import ReplayConfirmDialog from '@/core/scheduler/component/ReplayConfirmDialog.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'
	import { RunOutcome } from '@/core/scheduler/dto/enum/RunOutcome.ts'
	import type { ScheduledJobRunResponse } from '@/core/scheduler/dto/response/ScheduledJobRunResponse.ts'
	import { replayRun, useScheduledJobRunQuery } from '@/core/scheduler/api/SchedulerApi.ts'
	import { useSchedulerFormat } from '@/core/scheduler/composable/useSchedulerFormat.ts'
	import { useSetBreadcrumbExtra } from '@/_common/composable/general/useBreadcrumbs.ts'
	import { useAuth } from '@/_common/auth/authAdapter.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const { id } = defineProps<{ id: string }>()

	const i18n = useI18n()
	const router = useRouter()
	const auth = useAuth()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { formatDateTime, formatRunDuration, replayError } = useSchedulerFormat()
	const { setBreadcrumbExtra } = useSetBreadcrumbExtra()
	const { fetchById } = useScheduledJobRunQuery()

	const isAdmin = computed(() => auth.isAdminRole())
	const loading = ref(false)
	const run = ref<ScheduledJobRunResponse | null>(null)

	const replayDialog = ref(false)
	const replaying = ref(false)

	// Pretty-print the payload JSON for inspection; fall back to the raw text when it isn't valid JSON.
	const prettyPayload = computed(() => {
		if (!run.value?.payloadSnapshot) return ''
		try {
			return JSON.stringify(JSON.parse(run.value.payloadSnapshot), null, 2)
		} catch {
			return run.value.payloadSnapshot
		}
	})

	async function loadRun() {
		loading.value = true
		try {
			run.value = await fetchById(Number(id))
			// A run lives under its job, so build the full chain: jobs list › job › this run.
			setBreadcrumbExtra([
				{ title: i18n.t('navigation.schedulerJobs'), to: '/planovac/ulohy' },
				{ title: run.value.jobKey, to: `/planovac/ulohy/${run.value.jobId}` },
				{ title: i18n.t('scheduler.run.runNumber', { id: run.value.id }) },
			])
		} catch {
			// The axios interceptor already surfaces the error; clear stale data so the not-found card shows.
			run.value = null
		} finally {
			loading.value = false
		}
	}

	async function confirmReplay() {
		if (run.value === null || replaying.value) return
		replaying.value = true
		try {
			const newRunId = await replayRun(run.value.id)
			showSuccessSnackbar(i18n.t('scheduler.replay.success'))
			replayDialog.value = false
			// Jump to the new run if the backend told us its id; otherwise refresh lineage in place.
			if (typeof newRunId === 'number' && newRunId > 0) {
				await router.push({ name: 'schedulerRunDetail', params: { id: newRunId } })
			} else {
				await loadRun()
			}
		} catch (e: unknown) {
			showErrorSnackbar(replayError(e))
		} finally {
			replaying.value = false
		}
	}

	onMounted(loadRun)
</script>

<style scoped>
	.run-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}

	.run-correlation {
		font-family: monospace;
		font-size: 0.8125rem;
		word-break: break-all;
	}

	.run-payload {
		background: rgba(var(--v-theme-on-surface), 0.06);
		border-radius: 8px;
		padding: 12px;
		font-family: monospace;
		font-size: 0.8125rem;
		overflow-x: auto;
		white-space: pre;
		margin: 0;
	}
</style>
