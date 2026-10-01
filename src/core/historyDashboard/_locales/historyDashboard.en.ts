const messages = {
	dateRange: {
		rangeLength: `Range length`,
		from: `From`,
		to: `To`,
		threeDays: `3 days`,
		sevenDays: `7 days`,
		twoWeeks: `2 weeks`,
		month: `Month`,
		threeMonths: `3 months`,
		year: `Year`,
		customRange: `Custom range`,
		rangeInverted: `"To" must be the same day as "From" or later`,
		rangeTooLong: `A custom range may span at most {max} days`,
	},
	summaryCards: {
		topGroup: `Top {group}`,
		show: `Show`,
		total: `Total`,
		// The card is a toggle that cross-highlights the pie slice — it opens nothing (F30).
		viewDetails: `Highlight {name} in the chart`,
		// Keyed off the HistoryGroupBy enum values.
		groupLabel: {
			ACTIVITY: `Activities`,
			ROLE: `Roles`,
			CATEGORY: `Categories`,
		},
		// The name of the Activity/Role/Category toggle group (F90).
		groupBy: `Group by`,
	},
	periodBanner: {
		periodTotal: `Period total:`,
		vsPrevious: `vs previous:`,
		noBaseline: `no baseline`,
	},
	pieChart: {
		totalEntries: `Total entries:`,
		uniqueGroups: `Unique groups:`,
		periodTotals: `Period Totals`,
	},
	// H10. One key per whole sentence — the numbers and the group name sit in the middle of these, so
	// they are interpolated, never concatenated from fragments. Keyed off `HistoryInsightKind`.
	insights: {
		title: `Insights`,
		sessionLength: `You logged {total} across {entries} entries — about {mean} each.`,
		timeOfDay: `Between {from} and {to} you logged {total} — {share}% of the period.`,
		mostFragmented: `{name} is the most broken up: {total} across {entries} entries, about {mean} each.`,
		longestStretches: `{name} comes in your longest stretches: {total} across {entries} entries, about {mean} each.`,
	},
	timeline: {
		editTitle: `Edit Activity History`,
	},
	emptyState: {
		firstRunTitle: `No activity recorded yet`,
		firstRunMessage: `Log something you already did, or start a timer for what you're doing now.`,
		logManually: `Log manually`,
		startTimer: `Start a timer`,
	},
	export: {
		xlsxUnavailable: `Excel export isn't available yet — please use CSV.`,
		error: `Could not build the export.`,
		summary: {
			fileNamePrefix: `history-summary`,
			columns: {
				groupName: `Group`,
				totalSeconds: `Total time (s)`,
				totalDuration: `Total time`,
				entries: `Entry count`,
				percentChange: `Change vs baseline (%)`,
			},
		},
		detail: {
			fileNamePrefix: `history-detail`,
			columns: {
				start: `Start`,
				end: `End`,
				durationSeconds: `Duration (s)`,
				duration: `Duration`,
				activity: `Activity`,
				category: `Category`,
				role: `Role`,
				notes: `Notes`,
				// Empty on a row written outside a timer session.
				session: `Timer session`,
				phase: `Phase`,
				outcome: `Session outcome`,
			},
		},
	},
}
/** One root namespace — see the comment on the SK file, which carries the reasoning. */
const historyDashboard = { historyDashboard: messages }
export default historyDashboard
