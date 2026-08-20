const activityHistory = {
	history: {
		recordActivityToHistory: `Record activity to history`,
		lengthNotSet: `Length not set`,
		addedToHistory: `Added record of activity "{activity}" to history`,
		errorSavingToHistory: `Error saving record of activity "{activity}" to history`,

		selectDatePlease: `Please select a date`,
		noPresetsYet: `No presets yet`,
		timerPresetsTitle: `Timer Presets`,
		quickTimes: `Quick Times`,
		activityPresets: `Activity Presets`,
		confirmDeletePreset: `Are you sure you want to delete this preset?`,
		confirmDeleteNamedPreset: `Are you sure you want to delete preset "{name}"?`,
		logTaskTitle: `Log task: {activity}`,
		taskDoneFor: `Task done for {duration}`,
		historyUpdated: `Activity history updated`,
		historyUpdateFailed: `Failed to update activity history`,
		// Plugged into general.deleteConfirmationText ("Are you sure you want to delete {name}?").
		recordNounAccusative: `this activity history record`,

		summary: {
			title: `Activity History`,
			dayFrom: `Day from`,
			openCalendar: `Open calendar`,
		},
		detail: {
			title: `History Detail`,
			openCalendar: `Open calendar`,
			openSummary: `Back to summary for this week`,
		},
		calendar: {
			sessions: `{count} session | {count} sessions`,
			noActivity: `No activity`,
			notRecorded: `Not recorded`,
			noActivityInRange: `No activity recorded in the visible range.`,
		},
		timer: {
			setDurationFirst: `Please set a timer duration`,
			endedTitleAnim: `Timer ended!`,
			endedNotifTitle: `Timer ended`,
			endedNotifBody: `Your timer for {activity} ended — it ran for {duration}.`,
		},
		pomodoroPreset: {
			editTitle: `Edit Pomodoro Preset`,
			addTitle: `Add Pomodoro Preset`,
			tabBasic: `Basic`,
			tabWithFocus: `With Focus Activity`,
			tabWithBoth: `With Both Activities`,
			name: `Preset Name`,
			defaultName: `Pomodoro Preset`,
			timerDurations: `Timer Durations`,
			focusLabel: `Focus`,
			shortBreakLabel: `Short Break`,
			longBreakLabel: `Long Break`,
			cycleSettings: `Cycle Settings`,
			focusPeriodsPerCycle: `Focus Periods per Cycle`,
		},
		timerPreset: {
			editTitle: `Edit timer preset`,
			addTitle: `Add timer preset`,
		},
		// Notification and tab-title text for the pomodoro timer. `cycleInfo`/`focusInfo` are
		// pre-translated fragments built from cycleProgress/focusProgress and passed in as a
		// parameter — not concatenated — see PomodoroTimerView.vue.
		pomodoro: {
			title: `Pomodoro Timer`,
			defaults: `Defaults`,
			cycleProgress: `Cycle {current}/{total}`,
			focusProgress: `Focus {current}/{total}`,
			focusEndedTitleAnim: `Focus ended!`,
			timeForBreak: `Time for a break`,
			focusPeriodEndedTitle: `Focus period ended`,
			focusPeriodEndedBody: `{activity} · {focusInfo} · {cycleInfo}. Time for a break!`,
			breakEndedTitleAnim: `Break ended!`,
			timeToFocus: `Time to focus`,
			shortBreakEndedTitle: `Short break ended`,
			shortBreakEndedBody: `{cycleInfo} - Time to focus on {activity}!`,
			longBreakEndedTitleAnim: `Long break ended!`,
			startingCycle: `Starting cycle {n}`,
			longBreakEndedTitle: `Long break ended`,
			longBreakEndedBody: `Cycle {current} complete. Time for cycle {next}!`,
			completeCycleCount: `{count} cycle | {count} cycles`,
			completeTitleAnim: `🍅 Pomodoro complete! · {cycleCount}`,
			completeSubtitle: `{activity} - {duration}`,
			completeNotifTitle: `Pomodoro complete!`,
			doneSummary: `{count} cycle done! Focused on {activity} for {duration} | {count} cycles done! Focused on {activity} for {duration}`,
			restedWith: `, rested with {activity}`,
			// Always appended after doneSummary/restedWith, even when no rest activity was picked —
			// mirrors the original (slightly odd) behaviour; this pass does not change it.
			forDuration: ` for {duration}`,
		},
	},
}
export default activityHistory
