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
	},
	summaryCards: {
		topGroup: `Top {group}`,
		show: `Show`,
		total: `Total`,
		viewDetails: `View details for {name}`,
		// Keyed off the HistoryGroupBy enum values.
		groupLabel: {
			ACTIVITY: `Activities`,
			ROLE: `Roles`,
			CATEGORY: `Categories`,
		},
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
	timeline: {
		editTitle: `Edit Activity History`,
	},
}
/** One root namespace — see the comment on the SK file, which carries the reasoning. */
const historyDashboard = { historyDashboard: messages }
export default historyDashboard
