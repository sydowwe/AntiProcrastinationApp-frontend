import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { Time } from '@/_common/dto/dto/Time.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { BaselineOption, BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
import type { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
import type { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'

export type ActivityVisualization = 'stackedBars' | 'timeline'

/** Window sizes offered by the stacked-bars chart, in minutes. Single definition for all dashboards. */
export const activityWindowSizeOptions = [15, 20, 30, 60, 90, 120]

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

// --- URL query-state (defaults, encode/parse) ---

const DATE_PARAM = 'date'
const FROM_PARAM = 'from'
const TO_PARAM = 'to'
const VIEW_PARAM = 'view'
const BASELINE_PARAM = 'baseline'
const WINDOW_PARAM = 'window'
const SELECTED_PARAM = 'selected'

const DEFAULT_TIME_FROM = new Time(7, 0)
const DEFAULT_TIME_TO = new Time(0, 0)
const DEFAULT_VISUALIZATION: ActivityVisualization = 'timeline'
const DEFAULT_BASELINE = BaselineType.Last7Days
const DEFAULT_WINDOW_SIZE = 30

function firstQueryValue(value: unknown): string | undefined {
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0] : undefined
	}
	return typeof value === 'string' ? value : undefined
}

/** Strict yyyy-MM-dd parse — rejects anything dayjs-free `new Date(str)` would silently coerce. */
function parseIsoDate(value: string | undefined): Date | null {
	if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return null
	}
	const [year, month, day] = value.split('-').map(Number)
	const date = new Date(year, month - 1, day)
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null
	}
	return date
}

function parseTime(value: string | undefined): Time | null {
	if (value === undefined || !/^\d{2}:\d{2}$/.test(value)) {
		return null
	}
	const time = Time.fromString(value)
	if (time.hours < 0 || time.hours > 23 || time.minutes < 0 || time.minutes > 59) {
		return null
	}
	return time
}

function parseVisualization(value: string | undefined): ActivityVisualization | null {
	return value === 'stackedBars' || value === 'timeline' ? value : null
}

function parseBaseline(value: string | undefined): BaselineType | null {
	return (Object.values(BaselineType) as string[]).includes(value ?? '') ? (value as BaselineType) : null
}

function parseWindowSize(value: string | undefined): number | null {
	const parsed = Number(value)
	return activityWindowSizeOptions.includes(parsed) ? parsed : null
}

/**
 * State, fetch orchestration and event handling shared by the web-extension, desktop and android
 * dashboards. It knows nothing about any one source — everything source-specific arrives through
 * `fetchers` and everything source-specific about rendering stays in the view.
 */
export function useActivityDashboard<TPieChart>(fetchers: ActivityDashboardFetchers<TPieChart>) {
	const { t } = useI18n()
	const route = useRoute()
	const router = useRouter()

	/** Baselines the summary cards compare the selected day against. */
	const baselineOptions = computed<BaselineOption[]>(() => [
		new BaselineOption(BaselineType.Last7Days, t('activityTracking.baseline.last7Days')),
		new BaselineOption(BaselineType.Last30Days, t('activityTracking.baseline.last30Days')),
		new BaselineOption(BaselineType.SameWeekday, t('activityTracking.baseline.sameWeekday')),
		new BaselineOption(BaselineType.AllTime, t('activityTracking.baseline.allTime')),
	])

	// --- Date & Time State, seeded from the URL where present and valid ---
	const date = ref<Date>(parseIsoDate(firstQueryValue(route.query[DATE_PARAM])) ?? new Date())
	const timeFrom = ref(parseTime(firstQueryValue(route.query[FROM_PARAM])) ?? DEFAULT_TIME_FROM)
	const timeTo = ref(parseTime(firstQueryValue(route.query[TO_PARAM])) ?? DEFAULT_TIME_TO)

	// --- Shared State, also seeded from the URL ---
	const selectedItem = ref<string | null>(firstQueryValue(route.query[SELECTED_PARAM]) ?? null)
	const selectedBaseline = ref<BaselineType>(
		parseBaseline(firstQueryValue(route.query[BASELINE_PARAM])) ?? DEFAULT_BASELINE,
	)
	const selectedVisualization = ref<ActivityVisualization>(
		parseVisualization(firstQueryValue(route.query[VIEW_PARAM])) ?? DEFAULT_VISUALIZATION,
	)
	const selectedWindowSize = ref(parseWindowSize(firstQueryValue(route.query[WINDOW_PARAM])) ?? DEFAULT_WINDOW_SIZE)

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

	// The initial run must keep a `selected` value that arrived via the URL rather than wipe it.
	let isInitialRun = true

	watch(
		[date, timeFrom, timeTo],
		() => {
			if (isInitialRun) {
				isInitialRun = false
			} else {
				selectedItem.value = null
			}
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

	// --- URL sync: reflect bookmarkable state, omitting anything at its default ---
	function syncQueryToUrl() {
		const query: LocationQueryRaw = { ...route.query }

		const dateStr = formatDateForApi(date.value)
		if (dateStr === formatDateForApi(new Date())) {
			delete query[DATE_PARAM]
		} else {
			query[DATE_PARAM] = dateStr
		}

		if (timeFrom.value.getInMinutes === DEFAULT_TIME_FROM.getInMinutes) {
			delete query[FROM_PARAM]
		} else {
			query[FROM_PARAM] = timeFrom.value.getString()
		}

		if (timeTo.value.getInMinutes === DEFAULT_TIME_TO.getInMinutes) {
			delete query[TO_PARAM]
		} else {
			query[TO_PARAM] = timeTo.value.getString()
		}

		if (selectedVisualization.value === DEFAULT_VISUALIZATION) {
			delete query[VIEW_PARAM]
		} else {
			query[VIEW_PARAM] = selectedVisualization.value
		}

		if (selectedBaseline.value === DEFAULT_BASELINE) {
			delete query[BASELINE_PARAM]
		} else {
			query[BASELINE_PARAM] = selectedBaseline.value
		}

		if (selectedWindowSize.value === DEFAULT_WINDOW_SIZE) {
			delete query[WINDOW_PARAM]
		} else {
			query[WINDOW_PARAM] = String(selectedWindowSize.value)
		}

		if (selectedItem.value === null) {
			delete query[SELECTED_PARAM]
		} else {
			query[SELECTED_PARAM] = selectedItem.value
		}

		router.replace({ query }).catch(() => {
			// navigation duplication / redirection errors are non-fatal for state sync
		})
	}

	watch(
		[date, timeFrom, timeTo, selectedVisualization, selectedBaseline, selectedWindowSize, selectedItem],
		syncQueryToUrl,
	)

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
