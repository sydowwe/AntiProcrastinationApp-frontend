<template>
	<WidgetCard
		v-bind="$attrs"
		:title="$t('home.todoList')"
		:openRoute="{ name: 'toDoList' }"
		:loading="loading"
		:refreshing="refreshing"
		:error="error"
		:errorText="$t('home.loadFailedTodos')"
		:empty="visibleItems.length === 0"
		:emptyText="$t('home.noUpcomingTasks')"
		@retry="load"
	>
		<template #headerActions>
			<span class="text-caption text-medium-emphasis">{{ doneCount }}/{{ items.length }}</span>
			<VIconBtn
				:icon="hideDone ? 'fa-eye' : 'fa-eye-slash'"
				variant="text"
				size="small"
				:title="hideDone ? $t('home.showDone') : $t('home.hideDone')"
				:aria-label="hideDone ? $t('home.showDone') : $t('home.hideDone')"
				:aria-pressed="hideDone"
				@click="hideDone = !hideDone"
			/>
		</template>

		<!-- Above the list's own states: the rewards come from the daily recap, not from this list,
			 so neither an empty list (finishing the last task is exactly when a reward is earned) nor
			 a failed list fetch may take them down. -->
		<template #top>
			<EarnedRewardsStrip @start="startReward" />
		</template>

		<VList
			density="compact"
			class="pa-0"
		>
			<NormalTodoListItem
				v-for="item in visibleItems"
				:key="item.id"
				:toDoListItem="item"
				:kind="ToDoListKind.NORMAL"
				:listId="0"
				class="my-2"
				@isDoneChanged="handleIsDoneChanged"
				@stepToggled="refreshAfterStep"
				@edit="router.push({ name: 'toDoList' })"
				@delete="router.push({ name: 'toDoList' })"
				@addToPlanner="router.push({ name: 'dayPlanner', params: { date: todayUrlDate } })"
			/>
		</VList>
	</WidgetCard>
	<!-- Outside the card: the controller is a dialog, not card content. -->
	<BaseTodoListLogTimeController
		ref="logTimeController"
		:kind="ToDoListKind.NORMAL"
		@logTimeCreated="notifyTrackingSessionFinished"
	/>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { storeToRefs } from 'pinia'
	import { fetchDashboardTodoListItems, useTodoListItemCrud } from '@/core/todoList/api/todoListItemApi.ts'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { useHomeUiStore } from '@/core/home/store/homeUiStore.ts'
	import {
		notifyTodoItemsChanged,
		notifyTrackingSessionFinished,
		todayDate,
		useDashboardRefresh,
	} from '@/core/home/composable/useDashboardRefresh.ts'
	// Imported directly, not through `useTodayPlan()` — calling that would register a refresh
	// consumer this widget does not want. See the note in useTodayPlan.ts.
	import { todayUrlDate } from '@/core/home/composable/useTodayPlan.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import EarnedRewardsStrip from '@/core/todoList/component/normal/EarnedRewardsStrip.vue'
	import BaseTodoListLogTimeController from '@/core/todoList/component/BaseTodoListLogTimeController.vue'
	import { useEarnedRewardTracking } from '@/core/todoList/composable/useEarnedRewardTracking.ts'
	import { useEarnedRewardsStore } from '@/core/todoList/store/earnedRewardsStore.ts'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'

	// Two roots — the card and the reward timer's controller — so HomeView's `class="h-100"` is
	// forwarded to the card by hand.
	defineOptions({ inheritAttrs: false })

	/** This list's `useDashboardRefresh` key — also what it excludes when it notifies after a tick. */
	const TODO_LIST_REFRESH_KEY = 'home:todoList'

	const router = useRouter()
	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { toggleIsDone } = useTodoListItemCrud(0)
	const { hideDoneTodoList: hideDone } = storeToRefs(useHomeUiStore())
	const logTimeController = ref<InstanceType<typeof BaseTodoListLogTimeController>>()

	const items = ref<TodoListItemEntity[]>([])

	// A tick here earns the paired reward, and the strip at the top of this same card is the offer —
	// no snackbar on top of it. The list view needs its snackbar because it has nowhere else to put
	// the reward; here the reward appears beside the checkbox and does not time out.
	//
	// `resync: false`: the row flips before its PATCH lands, so a recap read on the flip could beat
	// the write and retire the reward with the old answer. `afterToggleSaved` re-reads instead.
	useEarnedRewardTracking(items, { resync: false })
	const earnedRewards = useEarnedRewardsStore()

	const loading = ref(true)
	const refreshing = ref(false)
	const error = ref(false)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

	// From the dashboard-wide date signal, not a `new Date()` captured at setup: this list sorts by
	// how far away the due date is, and on a tab left open overnight a frozen "today" quietly
	// re-labels everything by one day.
	function daysDiff(dueDate: string): number {
		const due = new Date(dueDate)
		due.setHours(0, 0, 0, 0)
		return Math.round((due.getTime() - todayDate.value.getTime()) / 86_400_000)
	}

	const sortedItems = computed(() =>
		[...items.value].sort((a, b) => {
			if (a.dueDate === null && b.dueDate === null) return 0
			if (a.dueDate === null) return 1
			if (b.dueDate === null) return -1
			return daysDiff(a.dueDate) - daysDiff(b.dueDate)
		}),
	)

	const visibleItems = computed(() => (hideDone.value ? sortedItems.value.filter(i => !i.isDone) : sortedItems.value))
	const doneCount = computed(() => items.value.filter(i => i.isDone).length)

	// `NormalTodoListItem` emits the item's id, not the entity — BaseTodoListItem.vue:289.
	function handleIsDoneChanged(id: number, forceValue?: boolean) {
		const item = items.value.find(i => i.id === id)
		if (!item) return
		// For a counted item `forceValue` is one step of its counter, not its final state: the row is
		// already showing the step, and only the server knows whether it tipped the item over.
		if (item.isMultipleCount) {
			toggleIsDone(id, forceValue)
				.then(refreshAfterStep)
				.catch(() => showErrorSnackbar(t('home.toggleTaskFailed', { task: item.activity.name })))
			return
		}
		const previousIsDone = item.isDone
		item.isDone = forceValue ?? !previousIsDone
		toggleIsDone(id, forceValue).then(afterToggleSaved, () => {
			item.isDone = previousIsDone
			showErrorSnackbar(t('home.toggleTaskFailed', { task: item.activity.name }))
		})
	}

	/**
	 * The server has the tick now, and it has already moved everything that follows from it: the
	 * recap the waiting rewards read, and today's planner task linked to the item. This list is right
	 * as it stands — the row was flipped on the click — so it is the one reader left out.
	 */
	function afterToggleSaved() {
		notifyTodoItemsChanged({ except: TODO_LIST_REFRESH_KEY })
	}

	/**
	 * A counter step or the last checklist step may have tipped the item to done, and only the server
	 * knows. This list cannot say so — the endpoint serves open items only, so a finished one simply
	 * vanishes — so unlike a plain tick it is refetched too, alongside everything else that reads the
	 * item's done state.
	 */
	function refreshAfterStep() {
		refreshNow()
		notifyTodoItemsChanged({ except: TODO_LIST_REFRESH_KEY })
	}

	function startReward(paired: ActivityBacklogProfile) {
		logTimeController.value?.openLeisureReward(paired)
	}

	/**
	 * `background` is what a dashboard refresh uses: the list stays on screen instead of collapsing
	 * to a spinner, and an existing error is left standing until the refetch actually succeeds.
	 */
	async function load({ background = false } = {}) {
		const token = ++loadToken
		if (background) refreshing.value = true
		else loading.value = true
		try {
			const result = await fetchDashboardTodoListItems()
			if (token !== loadToken) return
			items.value = result
			error.value = false
		} catch {
			if (token !== loadToken) return
			error.value = true
		} finally {
			if (token === loadToken) {
				loading.value = false
				refreshing.value = false
			}
		}
	}

	function refresh() {
		return load({ background: true })
	}

	// These items only change through somebody doing something — here, in the todo view, or on
	// another device. Coming back to the tab is when that becomes worth checking; a poll would only
	// add requests to a page nobody is looking at. Due dates are date-scoped, so rollover matters.
	// `refreshNow` rather than `refresh` for the in-widget reload after a step is ticked: going
	// through the coordinator stamps the freshness clock, so returning to the tab a minute later
	// does not refetch what was just fetched.
	// `onTodoItemsChanged`: completing a linked planner task in the planner widget completes the item
	// on the server, and this list serves open items only, so the item has to be fetched away.
	const { refreshNow } = useDashboardRefresh(TODO_LIST_REFRESH_KEY, {
		load,
		refresh,
		hasError: () => error.value,
		onTodoItemsChanged: true,
	})

	// The waiting rewards read the daily recap, which nothing pushes: a completion on the phone, a
	// planner task ticked done, tracked time crossing an item's estimate — all of them only show up
	// on the next read. So the recap rides the dashboard's own triggers: on mount, on returning to
	// the tab, on day rollover, when a timing session finishes anywhere on the page (a saved reward
	// flips `rewardTaken`), and when a tick here or in the planner widget has been saved.
	useDashboardRefresh('home:earnedRewards', {
		load: earnedRewards.resync,
		refresh: earnedRewards.resync,
		onTrackingSession: true,
		onTodoItemsChanged: true,
	})
</script>
