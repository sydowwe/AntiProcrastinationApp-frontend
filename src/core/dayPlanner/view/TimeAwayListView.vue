<template>
	<div
		class="py-6 w-100 mx-auto"
		style="max-width: 880px"
	>
		<div class="mb-2 d-flex flex-wrap justify-space-between align-center ga-3">
			<h1 class="text-h4">{{ t('planner.timeAway.listTitle') }}</h1>
			<VBtn
				color="secondary"
				prependIcon="umbrella-beach"
				@click="markNew"
			>
				{{ t('planner.timeAway.markAction') }}
			</VBtn>
		</div>
		<p class="text-body-2 text-medium-emphasis mb-6">{{ t('planner.timeAway.listIntro') }}</p>

		<VProgressLinear
			v-if="loading && stretches.length === 0"
			indeterminate
			color="secondary"
		/>
		<VAlert
			v-else-if="loadFailed"
			type="error"
			variant="tonal"
		>
			{{ t('planner.timeAway.loadFailed') }}
			<template #append>
				<VBtn
					variant="text"
					@click="load"
				>
					{{ t('planner.actions.retry') }}
				</VBtn>
			</template>
		</VAlert>
		<p
			v-else-if="stretches.length === 0"
			class="text-body-1 text-medium-emphasis"
		>
			{{ t('planner.timeAway.empty') }}
		</p>
		<template v-else>
			<section
				v-for="section in sections"
				:key="section.key"
				class="mb-8"
			>
				<h2 class="text-h6 mb-3">{{ section.title }}</h2>
				<div
					v-auto-animate
					class="d-flex flex-column ga-3"
				>
					<TimeAwayListItem
						v-for="timeAway in section.items"
						:key="timeAway.id"
						:timeAway
						:deleting="deletingId === timeAway.id"
						@edit="edit"
						@delete="remove"
					/>
				</div>
			</section>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useSetBreadcrumbExtra } from '@/_common/composable/general/useBreadcrumbs.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import TimeAwayListItem from '@/core/dayPlanner/component/timeAway/TimeAwayListItem.vue'
	import { useTimeAwayCrud } from '@/core/dayPlanner/api/timeAwayApi.ts'
	import { useTimeAwayDialog } from '@/core/dayPlanner/composable/useTimeAwayDialog.ts'
	import { TimeAwayFilter } from '@/core/dayPlanner/dto/request/TimeAwayFilter.ts'
	import type { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'

	// A quiet record of trips and sick spells, past and coming. Deliberately no totals and no counts
	// across stretches ("12 sick days this year"): it is the user's holiday or illness, not a score.

	const { t } = useI18n()
	const { confirm } = useDialog()
	const { showSuccessSnackbar } = useSnackbar()
	const { shouldConfirm } = useDeleteConfirmation()
	const { fetchFiltered, deleteEntity } = useTimeAwayCrud()
	const { openTimeAwayDialog } = useTimeAwayDialog()
	const { setBreadcrumbExtra } = useSetBreadcrumbExtra()

	setBreadcrumbExtra([{ title: t('planner.timeAway.listTitle'), to: '/day-planner/time-away' }])

	const stretches = ref<TimeAway[]>([])
	const loading = ref(false)
	const loadFailed = ref(false)
	const deletingId = ref<number | null>(null)

	// Upcoming (including one under way) soonest first; past newest first, so the recent end of each
	// list is the one at the top.
	const sections = computed(() => {
		const today = isoDateInUserZone()
		const upcoming = stretches.value.filter(s => s.endDate >= today)
		const past = stretches.value.filter(s => s.endDate < today).reverse()
		return [
			{ key: 'upcoming', title: t('planner.timeAway.upcoming'), items: upcoming },
			{ key: 'past', title: t('planner.timeAway.past'), items: past },
		].filter(section => section.items.length > 0)
	})

	onMounted(load)

	async function load() {
		loading.value = true
		loadFailed.value = false
		try {
			// No bounds: every stretch, oldest first.
			stretches.value = await fetchFiltered(new TimeAwayFilter())
		} catch (error) {
			if (!isRequestCanceled(error)) loadFailed.value = true
		} finally {
			loading.value = false
		}
	}

	async function markNew() {
		if (await openTimeAwayDialog()) await load()
	}

	async function edit(timeAway: TimeAway) {
		if (await openTimeAwayDialog({ timeAway })) await load()
	}

	// Not a cascade: the days stay, they only lose the stretch's type and name. So the user's
	// "ask before delete" preference decides, through the shared path.
	async function remove(timeAway: TimeAway) {
		if (shouldConfirm({ cascades: false, undoable: false })) {
			const confirmed = await confirm({
				title: t('planner.timeAway.deleteTitle', { name: timeAway.name }),
				text: t('planner.timeAway.deleteBody'),
				confirmBtnLabel: t('planner.timeAway.deleteConfirm'),
				confirmBtnColor: 'errorDark',
			})
			if (!confirmed) return
		}
		deletingId.value = timeAway.id
		try {
			await deleteEntity(timeAway.id)
			stretches.value = stretches.value.filter(s => s.id !== timeAway.id)
			showSuccessSnackbar(t('planner.timeAway.deleted', { name: timeAway.name }))
		} catch {
			// The interceptor has shown the server's reason.
		} finally {
			deletingId.value = null
		}
	}
</script>
