import { computed, ref, watch, type Ref } from 'vue'
import { Time } from '@/_common/dto/dto/Time.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { BaselineOption, BaselineType } from '@/core/activityTracking/component/summaryCards/BaselineOption.ts'
import type { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
import type { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'

export type ActivityVisualization = 'stackedBars' | 'timeline'

/** Window sizes offered by the stacked-bars chart, in minutes. Single definition for all dashboards. */
export const activityWindowSizeOptions = [15, 20, 30, 60, 90, 120]

/** Baselines the summary cards compare the selected day against. Single definition for all dashboards. */
export const baselineOptions: BaselineOption[] = [
	new BaselineOption(BaselineType.Last7Days, 'Last 7 days'),
	new BaselineOption(BaselineType.Last30Days, 'Last 30 days'),
	new BaselineOption(BaselineType.SameWeekday, 'Same weekday'),
	new BaselineOption(BaselineType.AllTime, 'All time'),
]

/** The day + time window every dashboard request is scoped to. `date` is already formatted for the API. */
export interface ActivityDashboardRange {
	date: string
	timeFrom: Time
	timeTo: Time
}

/** The three timeline lanes. A source without detail/background lanes returns empty arrays for them. */
export interface ActivityTimelineSessions {
	primarySessions: TimelineSessionDto[]
	detailSessions: TimelineSessionDto[]
	backgroundSessions: TimelineSessionDto[]
}

/**
 * The per-source half of a dashboard: four functions that each close over their own API module and
 * request class and return the shared view-model type. The pie chart is the one shape that is not
 * shared, so it stays generic and is handed back to the view untouched.
 */
export interface ActivityDashboardFetchers<TPieChart> {
	fetchSummaryCards(range: ActivityDashboardRange, baseline: BaselineType): Promise<SummaryCardsData[] | null>

	fetchPieChart(range: ActivityDashboardRange): Promise<TPieChart | null>

	fetchStackedBars(range: ActivityDashboardRange, windowSize: number): Promise<StackedBarsInputWindow[]>

	fetchTimeline(range: ActivityDashboardRange): Promise<ActivityTimelineSessions>
}

function emptyTimelineSessions(): ActivityTimelineSessions {
	return { primarySessions: [], detailSessions: [], backgroundSessions: [] }
}

/**
 * State, fetch orchestration and event handling shared by the web-extension, desktop and android
 * dashboards. It knows nothing about any one source — everything source-specific arrives through
 * `fetchers` and everything source-specific about rendering stays in the view.
 */
export function useActivityDashboard<TPieChart>(fetchers: ActivityDashboardFetchers<TPieChart>) {
	// --- Date & Time State ---
	const date = ref<Date>(new Date())
	const timeFrom = ref(new Time(7, 0))
	const timeTo = ref(new Time(0, 0))

	// --- Shared State ---
	const selectedItem = ref<string | null>(null)
	const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
	const selectedVisualization = ref<ActivityVisualization>('timeline')
	const selectedWindowSize = ref(30)

	// --- View Models ---
	const summaryCardsData = ref<SummaryCardsData[] | null>(null) as Ref<SummaryCardsData[] | null>
	const pieChartData = ref<TPieChart | null>(null) as Ref<TPieChart | null>
	const stackedBarsWindows = ref<StackedBarsInputWindow[]>([]) as Ref<StackedBarsInputWindow[]>
	const timelineSessions = ref<ActivityTimelineSessions>(emptyTimelineSessions()) as Ref<ActivityTimelineSessions>

	// --- Loading States ---
	const summaryCardsLoading = ref(false)
	const pieChartLoading = ref(false)
	const stackedBarsLoading = ref(false)
	const timelineLoading = ref(false)

	const primarySessions = computed(() => timelineSessions.value.primarySessions)
	const detailSessions = computed(() => timelineSessions.value.detailSessions)
	const backgroundSessions = computed(() => timelineSessions.value.backgroundSessions)

	const range = computed<ActivityDashboardRange>(() => ({
		date: formatDateForApi(date.value),
		timeFrom: timeFrom.value,
		timeTo: timeTo.value,
	}))

	// --- Timeline from/to as full Date objects ---
	const timelineFrom = computed(() => {
		const d = new Date(date.value)
		d.setHours(timeFrom.value.hours, timeFrom.value.minutes, 0, 0)
		return d
	})

	const timelineTo = computed(() => {
		const d = new Date(date.value)
		d.setHours(timeTo.value.hours, timeTo.value.minutes, 0, 0)
		if (d <= timelineFrom.value) {
			d.setDate(d.getDate() + 1)
		}
		return d
	})

	// --- Fetch Functions ---
	async function fetchSummaryCards() {
		summaryCardsLoading.value = true
		try {
			summaryCardsData.value = await fetchers.fetchSummaryCards(range.value, selectedBaseline.value)
		} finally {
			summaryCardsLoading.value = false
		}
	}

	async function fetchPieChart() {
		pieChartLoading.value = true
		try {
			pieChartData.value = await fetchers.fetchPieChart(range.value)
		} finally {
			pieChartLoading.value = false
		}
	}

	async function fetchStackedBars() {
		stackedBarsLoading.value = true
		try {
			stackedBarsWindows.value = await fetchers.fetchStackedBars(range.value, selectedWindowSize.value)
		} finally {
			stackedBarsLoading.value = false
		}
	}

	async function fetchTimeline() {
		timelineLoading.value = true
		try {
			timelineSessions.value = await fetchers.fetchTimeline(range.value)
		} finally {
			timelineLoading.value = false
		}
	}

	watch(
		[date, timeFrom, timeTo],
		() => {
			selectedItem.value = null
			fetchSummaryCards()
			fetchPieChart()
			fetchStackedBars()
			fetchTimeline()
		},
		{ immediate: true },
	)

	watch(selectedBaseline, () => {
		fetchSummaryCards()
	})

	// --- Event Handlers ---
	function handleBaselineChange(value: BaselineType) {
		selectedBaseline.value = value
	}

	/** Selecting the already-selected item clears the selection. */
	function handleItemSelect(name: string) {
		selectedItem.value = selectedItem.value === name ? null : name
	}

	function handleWindowSizeChange(size: number) {
		selectedWindowSize.value = size
		fetchStackedBars()
	}

	function handleActivityClick(_window: StackedBarsInputWindow, name: string) {
		handleItemSelect(name)
	}

	function handleSessionClick(session: TimelineSessionDto) {
		handleItemSelect(session.domain)
	}

	return {
		date,
		timeFrom,
		timeTo,
		selectedItem,
		selectedBaseline,
		selectedVisualization,
		selectedWindowSize,
		activityWindowSizeOptions,
		baselineOptions,
		summaryCardsData,
		pieChartData,
		stackedBarsWindows,
		primarySessions,
		detailSessions,
		backgroundSessions,
		timelineFrom,
		timelineTo,
		summaryCardsLoading,
		pieChartLoading,
		stackedBarsLoading,
		timelineLoading,
		fetchSummaryCards,
		fetchPieChart,
		fetchStackedBars,
		fetchTimeline,
		handleBaselineChange,
		handleItemSelect,
		handleWindowSizeChange,
		handleActivityClick,
		handleSessionClick,
	}
}
