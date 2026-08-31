<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center ga-3">
			<h2>{{ $t('planner.settings.pageTitle') }}</h2>
			<!-- The only edit this module took from P1: a link back to /user/settings, so the two
			     settings pages form a pair instead of two dead ends. A route name, not an import —
			     nothing here depends on `core/user`. -->
			<RouterLink
				class="text-body-2"
				:to="{ name: 'userSettings' }"
			>
				{{ $t('user.backToSettings') }}
			</RouterLink>
		</div>

		<VTabs
			v-model="activeTab"
			color="primaryOutline"
		>
			<VTab value="repeating">{{ $t('planner.settings.tabs.repeating') }}</VTab>
			<VTab value="reminders">{{ $t('planner.nudges.tab') }}</VTab>
			<VTab value="viewDefaults">{{ $t('planner.settings.tabs.viewDefaults') }}</VTab>
			<VTab value="skipReasons">{{ $t('planner.settings.tabs.skipReasons') }}</VTab>
			<VTab value="calendarView">{{ $t('planner.settings.tabs.calendarView') }}</VTab>
		</VTabs>

		<VTabsWindow
			v-model="activeTab"
			class="flex-fill"
		>
			<VTabsWindowItem
				value="repeating"
				class="flex-fill d-flex flex-column ga-4 pt-3"
			>
				<RepeatingTasksTab />
			</VTabsWindowItem>

			<VTabsWindowItem
				value="reminders"
				class="pt-3"
			>
				<PlannerRemindersTab />
			</VTabsWindowItem>

			<VTabsWindowItem
				value="viewDefaults"
				class="pt-3"
			>
				<ViewDefaultsTab />
			</VTabsWindowItem>

			<VTabsWindowItem
				value="skipReasons"
				class="pt-3 d-flex flex-column ga-4"
				style="max-width: 480px"
			>
				<SkipReasonsTab />
			</VTabsWindowItem>

			<VTabsWindowItem
				value="calendarView"
				class="pt-3"
			>
				<CalendarViewDefaultsTab />
			</VTabsWindowItem>
		</VTabsWindow>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import RepeatingTasksTab from '@/core/dayPlanner/component/settings/RepeatingTasksTab.vue'
	import PlannerRemindersTab from '@/core/dayPlanner/component/settings/PlannerRemindersTab.vue'
	import ViewDefaultsTab from '@/core/dayPlanner/component/settings/ViewDefaultsTab.vue'
	import SkipReasonsTab from '@/core/dayPlanner/component/settings/SkipReasonsTab.vue'
	import CalendarViewDefaultsTab from '@/core/dayPlanner/component/settings/CalendarViewDefaultsTab.vue'

	const settingsStore = useDayPlannerSettingsStore()
	const activeTab = ref('repeating')

	onMounted(async () => {
		await settingsStore.loadSettings()
	})

	let saveTimer: ReturnType<typeof setTimeout> | undefined
	watch(
		() => [
			settingsStore.remindersEnabled,
			settingsStore.reminderMinutesBefore,
			settingsStore.detailsPanelExpandedByDefault,
			settingsStore.arrowKeyNavEnabled,
			[...settingsStore.predefinedSkipReasons],
			settingsStore.slotDurationMinutes,
			settingsStore.defaultApplyTemplateId,
			settingsStore.defaultConflictResolution,
			settingsStore.defaultApplyPreviewMode,
		],
		() => {
			if (!settingsStore.loaded) return
			clearTimeout(saveTimer)
			saveTimer = setTimeout(() => settingsStore.saveSettings(), 500)
		},
		{ deep: true },
	)
</script>
