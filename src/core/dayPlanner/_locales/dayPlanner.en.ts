const dayPlanner = {
	planner: {
		task: `Activity`,
		quickCreatePlannerActivity: `Quick create planner activity`,
		quickEditPlannerActivity: `Quick edit activity`,
		importance: `Importance`,
		ignore: `Ignore`,
		overwrite: `Overwrite`,
		mergeIgnore: `Merge and ignore`,
		mergeOverwrite: `Merge and overwrite`,
		status: {
			notStarted: `Not started`,
			inProgress: `In progress`,
			onHold: `On hold`,
			completed: `Completed`,
			cancelled: `Cancelled`,
		},
		// See the comment in dayPlanner.sk.ts — this block replaced copy that read as a kill switch.
		nudges: {
			tab: `In-app nudges`,
			enable: `Nudge me before a task starts`,
			leadLabel: `Lead time`,
			minutesSuffix: `min`,
			explainer: `This nudge only appears while the planner is open in your browser. The same lead time is used as the default when you create a reminder for a task without setting one.`,
			realRemindersHint: `Reminders delivered even with the app closed — including turning them off entirely, and quiet hours — live under`,
			reminderPreferencesLink: `Reminder preferences`,
		},
		templateSuggestions: {
			suggestedForYou: `Suggested for you`,
			usedOn: `Used on {label}s`,
			timesCount: `{count}×`,
		},
	},
}
export default dayPlanner
