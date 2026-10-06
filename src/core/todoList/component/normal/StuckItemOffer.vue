<template>
	<!-- `click`/`mousedown` stop here: a click on the row body logs time and ticks the item, and a press
	     on it starts a drag. Neither may fire from inside the offer. -->
	<div
		class="stuckOffer mt-2 mx-3 pa-2 rounded"
		role="group"
		:aria-label="$t('toDoList.planHelp.groupLabel')"
		@click.stop
		@mousedown.stop
	>
		<div class="d-flex align-start ga-2">
			<VIcon
				icon="seedling"
				size="small"
				color="secondary-accent"
				class="mt-1"
			/>
			<span class="text-body-2 flex-fill">{{ $t(`toDoList.planHelp.lead.${kind}`) }}</span>
			<VIconBtn
				icon="xmark"
				variant="text"
				size="x-small"
				:title="$t('toDoList.planHelp.notNow')"
				:aria-label="$t('toDoList.planHelp.notNow')"
				@click="emit('dismiss')"
			/>
		</div>
		<div class="d-flex flex-wrap ga-1 mt-1">
			<VBtn
				v-for="(option, i) in options"
				:key="option.action"
				size="small"
				:variant="i === 0 ? 'tonal' : 'text'"
				:color="i === 0 ? 'secondaryOutline' : undefined"
				:prependIcon="option.icon"
				@click="emit('choose', option.action)"
			>
				{{ $t(`toDoList.planHelp.action.${option.action}`, { minutes: SHORT_START_MINUTES }) }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { PlanHelpKind, type PlanHelpAction, SHORT_START_MINUTES } from '@/core/todoList/dto/enum/PlanHelpKind.ts'

	const { kind, canPairReward = true } = defineProps<{
		kind: PlanHelpKind
		/** False when the item already has a reward paired — offering another would be noise. */
		canPairReward?: boolean
	}>()

	const emit = defineEmits<{
		choose: [action: PlanHelpAction]
		dismiss: []
	}>()

	const ICONS: Record<PlanHelpAction, string> = {
		startShort: 'stopwatch',
		split: 'list-check',
		pairReward: 'gift',
		letGo: 'feather',
	}

	// The kind decides which option leads; every option stays on offer, since the server's guess at *why*
	// the item keeps slipping is only a guess. Letting go leads only when the user's own skip reasons said
	// "not relevant any more", and otherwise comes last.
	const ORDER: Record<PlanHelpKind, PlanHelpAction[]> = {
		[PlanHelpKind.SmallerStep]: ['split', 'startShort', 'pairReward', 'letGo'],
		[PlanHelpKind.ShorterBlock]: ['startShort', 'split', 'pairReward', 'letGo'],
		[PlanHelpKind.Reconsider]: ['letGo', 'split', 'startShort', 'pairReward'],
	}

	const options = computed(() =>
		ORDER[kind]
			.filter(action => action !== 'pairReward' || canPairReward)
			.map(action => ({ action, icon: ICONS[action] })),
	)
</script>

<style scoped>
	.stuckOffer {
		background: rgba(var(--v-theme-secondary), 0.08);
		border: 1px solid rgba(var(--v-theme-secondary), 0.25);
		cursor: default;
	}
</style>
