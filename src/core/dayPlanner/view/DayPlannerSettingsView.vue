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
			<!-- No display utility on a window item (F41): `.d-flex` is `!important` and beats the inline
			     `display: none` Vuetify's `v-show` puts on an inactive item, so the panels stacked. The
			     flex column lives on an inner wrapper instead. -->
			<VTabsWindowItem
				value="repeating"
				class="pt-3 h-100"
			>
				<div class="h-100 d-flex flex-column ga-4">
					<RepeatingTasksTab />
				</div>
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
				class="pt-3"
			>
				<div
					class="d-flex flex-column ga-4"
					style="max-width: 480px"
				>
					<SkipReasonsTab />
				</div>
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
	import { onMounted, watch } from 'vue'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useQueryParamRef } from '@/core/dayPlanner/composable/useQueryParamRef.ts'
	import RepeatingTasksTab from '@/core/dayPlanner/component/settings/RepeatingTasksTab.vue'
	import PlannerRemindersTab from '@/core/dayPlanner/component/settings/PlannerRemindersTab.vue'
	import ViewDefaultsTab from '@/core/dayPlanner/component/settings/ViewDefaultsTab.vue'
	import SkipReasonsTab from '@/core/dayPlanner/component/settings/SkipReasonsTab.vue'
	import CalendarViewDefaultsTab from '@/core/dayPlanner/component/settings/CalendarViewDefaultsTab.vue'

	const settingsStore = useDayPlannerSettingsStore()

	const SETTINGS_TABS = ['repeating', 'reminders', 'viewDefaults', 'skipReasons', 'calendarView'] as const
	type SettingsTab = (typeof SETTINGS_TABS)[number]

	// `?tab=` survives a reload (F42); absent for the default so the bare URL stays clean.
	const { state: activeTab } = useQueryParamRef<SettingsTab>('tab', {
		defaultValue: 'repeating',
		parse: raw => SETTINGS_TABS.find(tab => tab === raw),
	})

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
