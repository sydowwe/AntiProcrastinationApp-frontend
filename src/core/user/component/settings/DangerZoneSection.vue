<template>
	<VCard
		variant="outlined"
		color="error"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3 class="text-error">
			<VIcon
				icon="triangle-exclamation"
				size="16"
				class="mr-1"
			/>
			{{ i18n.t('user.dangerZone.title') }}
		</h3>
		<p class="text-medium-emphasis text-body-2 ma-0">{{ i18n.t('user.dangerZone.intro') }}</p>
		<ul class="text-body-2 ma-0">
			<li
				v-for="item in i18n.tm('user.dangerZone.destroys') as string[]"
				:key="item"
			>
				{{ item }}
			</li>
		</ul>

		<VBtn
			variant="text"
			color="error"
			size="small"
			class="align-self-start"
			:loading="summaryLoading"
			@click="onToggleSummary"
		>
			{{ i18n.t(showSummary ? 'user.dangerZone.summary.hideNumbers' : 'user.dangerZone.summary.showNumbers') }}
		</VBtn>
		<template v-if="showSummary">
			<p
				v-if="summaryFailed"
				class="text-body-2 text-medium-emphasis ma-0"
			>
				{{ i18n.t('user.dangerZone.summary.loadFailed') }}
			</p>
			<ul
				v-else-if="summaryLines.length"
				class="text-body-2 ma-0"
			>
				<li
					v-for="line in summaryLines"
					:key="line"
				>
					{{ line }}
				</li>
			</ul>
		</template>

		<p class="text-body-2 font-weight-medium ma-0">{{ i18n.t('user.dangerZone.irreversible') }}</p>
		<VCard
			variant="tonal"
			color="primaryOutline"
			class="pa-3 d-flex flex-column ga-2"
		>
			<span class="text-body-2">{{ i18n.t('user.dangerZone.exportFirst') }}</span>
			<VBtn
				color="primary"
				prependIcon="download"
				@click="runExport"
			>
				{{ i18n.t('user.exportData') }}
			</VBtn>
		</VCard>
		<p class="text-medium-emphasis text-body-2 ma-0">
			{{ i18n.t('user.dangerZone.whereToDelete') }}
		</p>
	</VCard>
</template>
<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDataExport } from '@/core/user/composable/useDataExport.ts'
	import { useAccountDeletionSummaryApi } from '@/core/user/api/accountDeletionSummaryApi.ts'
	import type { AccountDeletionSummary } from '@/core/user/dto/response/AccountDeletionSummary.ts'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'

	const i18n = useI18n()
	const { runExport } = useDataExport()
	const { fetchSummary } = useAccountDeletionSummaryApi()

	const showSummary = ref(false)
	const summaryLoading = ref(false)
	const summaryFailed = ref(false)
	const summary = ref<AccountDeletionSummary | null>(null)

	async function onToggleSummary() {
		showSummary.value = !showSummary.value
		if (!showSummary.value || summary.value || summaryLoading.value) return
		summaryLoading.value = true
		summaryFailed.value = false
		try {
			summary.value = await fetchSummary()
		} catch {
			summaryFailed.value = true
		} finally {
			summaryLoading.value = false
		}
	}

	// Named per non-zero field so a field the server has not populated yet is silently skipped
	// rather than rendered as "0 of everything" — the summary is additive by design (B6).
	const summaryLines = computed(() => {
		const s = summary.value
		if (!s) return []
		const lines: string[] = []
		if (s.automaticTrackingEntryCount > 0)
			lines.push(i18n.t('user.dangerZone.summary.automaticTracking', { count: s.automaticTrackingEntryCount }))
		if (s.trackedSessionCount > 0) {
			let line = i18n.t('user.dangerZone.summary.trackedSessions', { count: s.trackedSessionCount })
			if (s.trackedFrom && s.trackedTo) {
				line += ` (${i18n.t('user.dangerZone.summary.trackedSpan', {
					from: formatToDate(new Date(s.trackedFrom)),
					to: formatToDate(new Date(s.trackedTo)),
					days: s.trackedTimeSpanDays,
				})})`
			}
			lines.push(line)
		}
		if (s.dayPlanCount > 0)
			lines.push(
				i18n.t('user.dangerZone.summary.dayPlans', { count: s.dayPlanCount, taskCount: s.plannerTaskCount }),
			)
		if (s.dayTemplateCount > 0)
			lines.push(i18n.t('user.dangerZone.summary.dayTemplates', { count: s.dayTemplateCount }))
		if (s.todoListCount > 0)
			lines.push(
				i18n.t('user.dangerZone.summary.todoLists', { count: s.todoListCount, itemCount: s.todoItemCount }),
			)
		if (s.routineCount > 0) lines.push(i18n.t('user.dangerZone.summary.routines', { count: s.routineCount }))
		if (s.leisureItemCount > 0)
			lines.push(i18n.t('user.dangerZone.summary.leisureItems', { count: s.leisureItemCount }))
		if (s.memoryAnchorCount > 0)
			lines.push(i18n.t('user.dangerZone.summary.memoryAnchors', { count: s.memoryAnchorCount }))
		if (s.activityCount > 0) lines.push(i18n.t('user.dangerZone.summary.activities', { count: s.activityCount }))
		if (s.googleCalendarLinked) lines.push(i18n.t('user.dangerZone.summary.googleCalendarLinked'))
		return lines
	})
</script>
