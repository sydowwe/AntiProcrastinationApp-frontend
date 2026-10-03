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
		// Information, not an error — a session under half a minute rounds to zero and cannot be
		// recorded (see useSessionLength.ts).
		sessionTooShortToLog: `That session was too short to record — nothing was saved`,
		// Plugged into general.deleteConfirmationText ("Are you sure you want to delete {name}?").
		recordNounAccusative: `this activity history record`,

		summary: {
			title: `Activity History`,
			dayFrom: `Day from`,
			openCalendar: `Open calendar`,
			// Display name of the pie chart's `_other` roll-up row (see HistoryGroupKey.ts).
			otherGroup: `Other`,
		},
		detail: {
			title: `History Detail`,
			openCalendar: `Open calendar`,
			openSummary: `Back to summary for this week`,
			restoreRange: `Back to {from}–{to}`,
		},
		calendar: {
			title: `History Calendar`,
			openSummary: `Open summary`,
			sessions: `{count} session | {count} sessions`,
			noActivity: `No activity`,
			notRecorded: `Not recorded`,
			noActivityInRange: `No activity recorded in the visible range.`,
		},
		// Only one timing session may run at a time; these are what the user is asked when starting a
		// second one — see useTimerSessionGuard.ts.
		session: {
			replaceTitle: `Another timer is running`,
			replaceText: `{timer} is running for "{activity}". Starting a new session discards it.`,
			replaceTextNoActivity: `{timer} is running. Starting a new session discards it.`,
			discardEndedTitle: `An unlogged session is waiting`,
			discardEndedText: `A finished {timer} session for "{activity}" has not been recorded yet. Starting a new one discards it.`,
			discardEndedTextNoActivity: `A finished {timer} session has not been recorded yet. Starting a new one discards it.`,
			replaceConfirm: `Discard and start`,
			// The name of TrackTimeDialog's stopwatch/timer/pomodoro toggle group (F90).
			method: `Timing method`,
			// The day's timeline: a pomodoro folded into one unit (HistorySessionGroup), and the phase /
			// outcome labels on a session's rows (HistoryRecordItem). Descriptive, never a verdict.
			pomodoroUnit: `Pomodoro`,
			focusTotal: `Focus {duration}`,
			// A session that did not run its whole plan, set against what the timer was set for (OP6).
			focusOfPlanned: `Focus {duration} of {planned} planned`,
			stoppedEarlyOfPlanned: `Stopped early: {duration} of {planned} planned`,
			showPhases: `Show phases ({count})`,
			hidePhases: `Hide phases`,
			phase: {
				focus: `Focus`,
				shortBreak: `Short break`,
				longBreak: `Long break`,
			},
			// A countdown row's note, and the Detail CSV's outcome column. The pomodoro's own line, with
			// its counts, is history.pomodoro.outcome.
			outcome: {
				completed: `Ran to the end`,
				stoppedEarly: `Stopped early`,
				ranOutWhileAway: `Ended while the app was closed`,
			},
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
			presetType: `Preset type`,
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
			// Under the save prompt: how far the plan got (PomodoroSaveBody). Plural on {total}.
			// Descriptive on purpose — a stopped session is information, not a failure.
			outcome: {
				completed: `Ran the whole plan: {total} focus period | Ran the whole plan: {total} focus periods`,
				stoppedEarly: `Stopped after {done} of {total} focus period | Stopped after {done} of {total} focus periods`,
				ranOutWhileAway: `The app was closed, so it stopped after {done} of {total} focus period | The app was closed, so it stopped after {done} of {total} focus periods`,
			},
		},
	},
}
export default activityHistory
