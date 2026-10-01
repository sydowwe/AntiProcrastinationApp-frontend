<template>
	<!--
		Always in the DOM, even empty: a polite live region only announces what is added to one that
		already exists, and a reward appearing next to the task just ticked off is exactly the thing a
		screen-reader user would otherwise miss.
	-->
	<div
		v-auto-animate
		role="group"
		aria-live="polite"
		:aria-label="$t('toDoList.pairing.waitingRegion')"
		class="d-flex flex-column ga-1"
		:class="{ 'pt-3': waiting.length > 0 }"
	>
		<div
			v-for="reward in waiting"
			:key="reward.itemId"
			class="d-flex align-center ga-1"
		>
			<VBtn
				variant="tonal"
				color="secondaryOutline"
				size="small"
				prependIcon="gift"
				class="text-none flex-shrink-0"
				:title="$t('toDoList.pairing.waitingStart', { name: reward.name, task: reward.taskName })"
				:aria-label="$t('toDoList.pairing.waitingStart', { name: reward.name, task: reward.taskName })"
				@click="start(reward)"
			>
				{{ reward.label }}
			</VBtn>
			<!-- Visible, not only in the tooltip: two tasks can share one reward, and without the task
				 the two rows would read as a duplicate. The task is also what the reward is tied to. -->
			<!-- The one part that gives way when the card is narrow: it truncates, so "Not today" never
				 wraps under the reward it belongs to. -->
			<span
				class="text-caption text-medium-emphasis text-truncate flex-grow-1"
				:title="$t('toDoList.pairing.earnedFor', { task: reward.taskName })"
			>
				{{ $t('toDoList.pairing.earnedFor', { task: reward.taskName }) }}
			</span>
			<VBtn
				variant="text"
				color="textMuted"
				size="small"
				class="text-none flex-shrink-0"
				:aria-label="$t('toDoList.pairing.notTodayLabel', { name: reward.name })"
				@click="store.resolve(reward.itemId)"
			>
				{{ $t('toDoList.pairing.notToday') }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import { fromMinutes } from '@/_common/utils/formatDuration.ts'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { useLeisurePairing } from '@/core/todoList/composable/useLeisurePairing.ts'
	import { useEarnedRewardsStore } from '@/core/todoList/store/earnedRewardsStore.ts'

	/**
	 * Rewards earned today that are still waiting — compact on purpose. A reward is a small pleasant
	 * thing, not a task: no checkbox, no count, never overdue styling. One tap starts it; "Not today"
	 * lets it go without a follow-up message. Either way nothing counts it.
	 *
	 * Two things the host owns:
	 * - **when the recap is re-read** (`earnedRewardsStore.resync`) — the dashboard's own refresh
	 *   triggers decide that for every widget, and this is one more reader of them;
	 * - **the log-time controller** that `start` hands the reward to. The timer outlives the reward
	 *   (Start hides it at once), and what it saves is the host's to announce — the home widget
	 *   turns it into the dashboard's tracking signal.
	 */

	const emit = defineEmits<{
		start: [paired: ActivityBacklogProfile]
	}>()

	const { t } = useI18n()
	const store = useEarnedRewardsStore()
	// The app's shared one-minute clock: a tab left open over midnight drops yesterday's rewards
	// within a minute, without a reload.
	const { currentTime } = useCurrentTime()
	const { ensureLoaded: ensureLeisurePairingLoaded, pairingFor } = useLeisurePairing()
	onMounted(ensureLeisurePairingLoaded)

	interface WaitingReward {
		itemId: number
		taskName: string
		name: string
		label: string
		paired: ActivityBacklogProfile
	}

	// A reward whose backlog profile is gone (deleted from the leisure backlog since) has nothing to
	// start, so it is not shown rather than shown broken.
	const waiting = computed<WaitingReward[]>(() =>
		store.waitingAt(currentTime.value).flatMap(reward => {
			const paired = pairingFor(reward.leisureActivityId)
			if (!paired) return []
			const name = paired.activity.name
			const earned = t('toDoList.pairing.chipTitleDone', { name })
			const label = paired.durationMinutes > 0 ? `${earned} · ${fromMinutes(paired.durationMinutes)}` : earned
			return [{ itemId: reward.itemId, taskName: reward.taskName, name, label, paired }]
		}),
	)

	/**
	 * Pressing Start hides it here at once. The server only counts it taken once the timer is saved to
	 * history, so without the local mark a running reward would still be offered — the same rule as
	 * the completion snackbar's Start.
	 */
	function start(reward: WaitingReward) {
		store.resolve(reward.itemId)
		emit('start', reward.paired)
	}
</script>
