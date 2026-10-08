<!--
	FO5: the one-time card above the now bar after four days or more away. It turns the pile into three
	decisions with sensible defaults and one button, instead of a page of overdue banners and a full bell.

	Renders nothing without a card. It never leads with a number: each row names what waited before it
	says how many, and the length of the absence is not mentioned at all. An absence the user marked as
	vacation or sick days (FO1) is greeted as time off.
-->
<template>
	<!-- The surface card with a primary edge rather than a tonal one: tonal tints every radio label, and the
		 choices are text the user has to read. -->
	<VCard
		v-if="card"
		tag="section"
		class="border-s-lg border-primary border-opacity-100"
		:aria-labelledby="titleId"
	>
		<VCardItem>
			<template #prepend>
				<VIcon
					icon="fa-door-open"
					color="primary"
				/>
			</template>
			<VCardTitle
				:id="titleId"
				class="text-wrap"
			>
				{{ card.wasMarkedAway ? $t('home.welcomeBack.titleMarkedAway') : $t('home.welcomeBack.title') }}
			</VCardTitle>
			<VCardSubtitle class="text-wrap">
				{{ hasChoices ? $t('home.welcomeBack.intro') : $t('home.welcomeBack.introEmpty') }}
			</VCardSubtitle>
		</VCardItem>

		<VCardText
			v-if="hasChoices || card.brokenRoutines.length > 0"
			class="d-flex flex-column ga-2"
		>
			<WelcomeBackChoice
				v-if="card.overdueTodos.count > 0"
				v-model="todos"
				icon="fa-list-check"
				:heading="$t('home.welcomeBack.todos.heading')"
				:summary="summarise(card.overdueTodos)"
				:options="todoOptions"
			/>
			<WelcomeBackChoice
				v-if="card.pastTasks.count > 0"
				v-model="pastTasks"
				icon="fa-calendar-xmark"
				:heading="$t('home.welcomeBack.tasks.heading')"
				:summary="summarise(card.pastTasks)"
				:options="taskOptions"
			/>
			<WelcomeBackChoice
				v-if="card.unreadNotifications > 0"
				v-model="markNotificationsRead"
				icon="fa-bell"
				:heading="$t('home.welcomeBack.notifications.heading')"
				:summary="
					$t(
						'home.welcomeBack.notifications.summary',
						{ count: card.unreadNotifications },
						card.unreadNotifications,
					)
				"
				:options="notificationOptions"
			/>
			<p
				v-if="card.brokenRoutines.length > 0"
				class="d-flex align-start ga-2 text-body-2 ps-4"
			>
				<VIconSmall
					icon="fa-seedling"
					class="mt-1"
				/>
				<span>
					{{ $t('home.welcomeBack.routines', { names: joinNames(card.brokenRoutines.map(r => r.text)) }) }}
				</span>
			</p>
		</VCardText>

		<VCardActions class="flex-wrap justify-end ga-2 px-4 pb-3">
			<VBtn
				variant="text"
				:disabled="applying"
				@click="dismiss"
			>
				{{ hasChoices ? $t('home.welcomeBack.dismiss') : $t('home.welcomeBack.gotIt') }}
			</VBtn>
			<VBtn
				v-if="hasChoices"
				color="primary"
				prependIcon="fa-seedling"
				:loading="applying"
				@click="submit"
			>
				{{ $t('home.welcomeBack.startFresh') }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref, useId } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { localeTag } from '@/i18n.ts'
	import WelcomeBackChoice from '@/core/home/component/WelcomeBackChoice.vue'
	import { useWelcomeBack } from '@/core/home/composable/useWelcomeBack.ts'
	import { ApplyFreshStartRequest } from '@/core/home/dto/request/ApplyFreshStartRequest.ts'
	import type { WelcomeBackPile } from '@/core/home/dto/response/WelcomeBack.ts'
	import {
		FRESH_START_SPREAD_DAYS,
		FreshStartTaskChoice,
		FreshStartTodoChoice,
	} from '@/core/home/dto/enum/FreshStartChoice.ts'

	const { t, locale } = useI18n()
	const { card, applying, startFresh, dismiss } = useWelcomeBack()
	const titleId = useId()

	// The defaults are the lightest morning: the to-dos stop all landing today, the blocks nobody was
	// there for are closed without counting against anything, and the bell starts at zero.
	const todos = ref(FreshStartTodoChoice.Spread)
	const pastTasks = ref(FreshStartTaskChoice.CloseAsAway)
	const markNotificationsRead = ref(true)

	const todoOptions = computed(() => [
		{
			value: FreshStartTodoChoice.Spread,
			label: t('home.welcomeBack.todos.spread', { count: FRESH_START_SPREAD_DAYS }),
		},
		{ value: FreshStartTodoChoice.Someday, label: t('home.welcomeBack.todos.someday') },
		{ value: FreshStartTodoChoice.Keep, label: t('home.welcomeBack.todos.keep') },
	])
	const taskOptions = computed(() => [
		{ value: FreshStartTaskChoice.CloseAsAway, label: t('home.welcomeBack.tasks.closeAsAway') },
		{ value: FreshStartTaskChoice.CarryToToday, label: t('home.welcomeBack.tasks.carryToToday') },
		{ value: FreshStartTaskChoice.Keep, label: t('home.welcomeBack.tasks.keep') },
	])
	const notificationOptions = computed(() => [
		{ value: true, label: t('home.welcomeBack.notifications.markRead') },
		{ value: false, label: t('home.welcomeBack.notifications.keep') },
	])

	const hasChoices = computed(
		() =>
			card.value !== null &&
			(card.value.overdueTodos.count > 0 || card.value.pastTasks.count > 0 || card.value.unreadNotifications > 0),
	)

	function joinNames(names: string[]) {
		return new Intl.ListFormat(localeTag(locale.value), { style: 'long', type: 'conjunction' }).format(names)
	}

	/** "Call the insurer, Taxes and 4 more" — the names first, the count only for what is left over. */
	function summarise(pile: WelcomeBackPile) {
		const names = pile.preview.map(item => item.name)
		const rest = pile.count - names.length
		return rest > 0
			? t('home.welcomeBack.andMore', { names: names.join(', '), count: rest }, rest)
			: joinNames(names)
	}

	/**
	 * A row that is not on screen is sent as "keep": the server re-reads the pile, and something that landed
	 * in it after this card was read must not be decided by a choice the user never saw.
	 */
	function submit() {
		const shown = card.value
		if (!shown) return
		void startFresh(
			new ApplyFreshStartRequest(
				shown.overdueTodos.count > 0 ? todos.value : FreshStartTodoChoice.Keep,
				FRESH_START_SPREAD_DAYS,
				shown.pastTasks.count > 0 ? pastTasks.value : FreshStartTaskChoice.Keep,
				shown.unreadNotifications > 0 && markNotificationsRead.value,
			),
		)
	}
</script>
