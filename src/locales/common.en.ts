// App-wide namespaces not owned by a single core module — the app-level counterpart of
// @/_common/_locales/common.en.ts, which has been complete in English since `e04dad2`.
//
// How the two meet is decided in `EN.ts`: `general`, `dateTime`, `controls`, `httpErrors` and
// `calendar` are DEEP-MERGED (framework keys survive, this app wins collisions), so a key only needs
// to be here when this app wants a different wording or the framework has no such key. `validation`
// and `iconPicker` below are still shallow replacements — they are complete against the framework's
// copies today and differ only in wording. If one of them ever falls behind a framework key, move it
// to the merge in `EN.ts` rather than adding the key by hand (`httpErrors` and `calendar` went that
// way 2026-09-21).
import { en } from 'vuetify/locale'

const common = {
	// This app's wording for the framework http interceptor's messages. Merged over the framework's
	// `httpErrors` (see the header), so only the keys this app words differently need to be here —
	// the typed 409/403 keys (`conflictUnique`, `conflictForeignKey`, …) come from the framework.
	httpErrors: {
		badRequest: `The request contains invalid data.`,
		unauthorized: `You need to sign in to perform this action.`,
		forbidden: `You don't have permission to perform this action.`,
		notFound: `The requested item was not found.`,
		conflict: `This record was changed by someone else. Refresh the page and try again.`,
		internalServerError: `A server error occurred. Please try again later.`,
		errorId: `Error id: {id}`,
		serviceUnavailable: `The service is temporarily unavailable. Please try again later.`,
		gatewayTimeout: `The server is not responding in time. Please try again later.`,
		unexpected: `An unexpected error occurred.`,
		unknown: `An unknown error occurred. Please contact support.`,
	},
	// This app's wording for the framework's `useGeneralRules` messages — same contract as
	// `httpErrors` above: a wholesale replacement, so it must stay complete.
	validation: {
		required: `This field is required`,
		onlyLetters: `The field may contain letters only`,
		lettersAndSpecialChars: `The field may contain letters and special characters only`,
		onlyNumbers: `The field may contain digits only`,
		lettersAndNumbers: `The field may contain letters and digits only`,
		ico: `The company ID must be exactly 8 digits`,
		invalidEmail: `Invalid e-mail format`,
		houseNumber: `Invalid house number (e.g. 12, 12A or 12/A)`,
	},
	// Vuetify's own English strings, resolved through the vue-i18n adapter `createAppVuetify` installs.
	// This used to be a hand copy of the same object, which silently fell two keys behind a Vuetify
	// bump (`timePicker.notAllowed`, `command.search` — F58); the import cannot drift.
	$vuetify: en,
	navigation: {
		home: `Home`,
		history: `History`,
		historySummary: `Summary`,
		historyCalendar: `Calendar`,
		unifiedActivityTracking: `All sources`,
		activityTracking: `Web tracking`,
		desktopActivityTracking: `Desktop tracking`,
		androidActivityTracking: `Android tracking`,
		createNewActivity: `Create new kind of activity`,
		toDoList: `To-do list`,
		routineToDoList: `Routine`,
		recordActivity: `Record activity`,
		recordActivityManually: `Manually`,
		pomodoroTimer: `Pomodoro timer`,
		stopwatch: `Stopwatch`,
		timer: `Timer`,
		alarm: `Alarm`,
		taskPlanner: `Task planner`,
		dayPlanner: `Day planner`,
		templateDayPlanner: `Day planner - template`,
		dayPlannerSettings: `Planner settings`,
		desktopSettings: `Desktop settings`,
		androidSettings: `Android settings`,
		activitySettings: `Activity settings`,
		leisure: `Leisure`,
		leisurePicker: `What should I do?`,
		backlog: `Backlog`,
		projects: `Projects`,
		bucketList: `Bucket list`,
		memoryAnchors: `Memory anchors`,
		// Not a sidebar item — the framework's UserMenu links to it by this key.
		myReminders: `My reminders`,
		reminders: `Reminders`,
		reminderDefinitions: `Reminder register`,
		reminderUpcoming: `Upcoming`,
		reminderOverview: `Overview`,
		reminderDispatchHistory: `Dispatch history`,
		scheduler: `Job scheduler`,
		schedulerJobs: `Scheduled jobs`,
		schedulerNeedsAttention: `Needs attention`,
	},
	// Replaces the framework's `app` namespace, which carries the reference app's brand name.
	// Rendered in the top bar. `brandName` is the framework's only key there, so nothing is lost to
	// the shallow spread in EN.ts.
	app: {
		brandName: `Adhd time organizer`,
	},
	// Deep-merged over the framework's `general` in `EN.ts` — only this app's own keys and its
	// deliberate rewordings live here; anything identical to the framework's copy was deleted (F35).
	general: {
		or: `Or`,
		please: `Please`,
		close: `Close`,
		create: `Create`,
		filter: `Filter`,
		// Accessible names for controls that render an icon and nothing else.
		toggleSortDirection: `Change sort direction`,
		moreActions: `More actions`,
		send: `Send`,
		save: `Save`,
		cancel: `Cancel`,
		edit: `Edit`,
		add: `Add`,
		iAgreeTo: 'I agree to the',
		name: `Name`,
		text: `Text`,
		continue: `Continue`,
		done: `Done`,
		error: `Error`,
		select: `Select`,
		unselect: `Unselect`,
		delete: `Delete`,
		clear: `Clear`,
		task: `Task`,
		hide: `Hide`,
		show: `Show`,
		confirm: `Confirm`,
		new: `New`,
		update: `Update`,
		optional: `Optional`,
		search: `Search`,
		uncategorized: `Uncategorized`,
		all: `All`,
		addToPlanner: `Add to planner`,
		logTime: `Log time`,
		moveToList: `Move to list`,
		nothingToUndo: `Nothing to undo`,
		// This app's wording; the framework says "Confirm deletion" / "You do not have permission …".
		deleteConfirmationTitle: `Delete confirmation`,
		forbidden: `You don't have permission to view this page.`,
		start: `Start`,
		// The skip link in `App.vue` — the first tab stop on every page.
		skipToContent: `Skip to main content`,
		backHome: `Back to home`,
	},
	// The catch-all route (`src/router.ts`) — rendered for any URL no module claims.
	notFound: {
		title: `Page not found`,
		text: `This address does not lead anywhere. Check the link or go back to the home page.`,
	},
	dateTime: {
		when: `When`,
		length: `Length`,
		lengthRequired: `Length must be greater than 0`,
		date: `Date`,
		time: `Time`,
		year: `Year`,
		month: `Month`,
		day: `Day`,
		hour: `Hour`,
		minute: `Minute`,
		second: `Second`,
		hours: `Hours`,
		minutes: `Minutes`,
		seconds: `Seconds`,
		dateFrom: `Date from`,
		dateTo: `Date to`,
		howManyHoursBack: `How many hours back`,
		dateRange: `Date range`,
		hoursBack: `Hours back`,
		today: `Today`,
		// Deep-merged over the framework's `dateTime` in `EN.ts` (F35) — the keys the framework's
		// `DateRangePicker` / `MonthYearPicker` / `TimeDisplay` / `TimeRangePicker` resolve come from
		// its own file now. Only this app's deliberate rewordings stay:
		// the framework says "Anchor point"; this app's pickers label the field "Anchor".
		anchor: `Anchor`,
		// Deliberately not the framework's wording, which hardcodes "31 days" — `maxDays` is a prop and
		// this app passes 366 for the activity dashboards.
		dateRangeExceedsLimit: `The selected date range is too long`,
	},
	controls: {
		start: `Start`,
		pause: `Pause`,
		stop: `Stop`,
		reset: `Reset`,
		resetToDefaults: `Reset to defaults`,
		presets: `Presets`,
		settings: `Settings`,
		edit: `Edit`,
	},
	successFeedback: {
		added: `Added`,
		edited: `Edited`,
		deleted: `Deleted`,
		moved: `Moved successfully`,
	},
	theme: {
		label: `Theme`,
		light: `Light`,
		dark: `Dark`,
		system: `System`,
		switchToLight: `Switch to light mode`,
		switchToDark: `Switch to dark mode`,
	},
	locales: {
		SK: `Slovak`,
		EN: `English`,
		CZ: `Czech`,
	},
	weekdays: {
		short: {
			mon: `Mon`,
			sun: `Sun`,
		},
	},
	// This app's wording for `_common/component/calendar/CalendarGrid.vue`'s strings. Merged over
	// the framework's `calendar` (see the header) since B19 — the day names are this app's wording;
	// `holidays` has no framework counterpart.
	calendar: {
		daysToShow: `Days to show`,
		allWeek: `All week`,
		workdays: `Workdays (Mon-Fri)`,
		weekend: `Weekend (Sat-Sun)`,
		monday: `Monday`,
		tuesday: `Tuesday`,
		wednesday: `Wednesday`,
		thursday: `Thursday`,
		friday: `Friday`,
		saturday: `Saturday`,
		sunday: `Sunday`,
		mon: `Mon`,
		tue: `Tue`,
		wed: `Wed`,
		thu: `Thu`,
		fri: `Fri`,
		sat: `Sat`,
		sun: `Sun`,
		// Keyed by the backend's stable `holidayKey` (B19) and resolved by the framework's
		// `useHolidayLabel()`. The set is fixed to Slovak public holidays and never renamed.
		holidays: {
			NEW_YEAR: `Day of the Establishment of the Slovak Republic / New Year's Day`,
			EPIPHANY: `Epiphany (Three Kings)`,
			GOOD_FRIDAY: `Good Friday`,
			EASTER_MONDAY: `Easter Monday`,
			LABOUR_DAY: `Labour Day`,
			VICTORY_DAY: `Victory over Fascism Day`,
			CYRIL_AND_METHODIUS: `St. Cyril and Methodius Day`,
			SNP_ANNIVERSARY: `Slovak National Uprising Anniversary`,
			CONSTITUTION_DAY: `Constitution Day`,
			OUR_LADY_OF_SORROWS: `Our Lady of Sorrows`,
			ALL_SAINTS: `All Saints' Day`,
			FREEDOM_AND_DEMOCRACY_DAY: `Struggle for Freedom and Democracy Day`,
			CHRISTMAS_EVE: `Christmas Eve`,
			CHRISTMAS_DAY: `Christmas Day`,
			ST_STEPHENS_DAY: `St. Stephen's Day`,
		},
	},
	// This app's wording for `_common/component/inputs/IconPicker.vue` + `IconPickerDialog.vue`.
	// Same contract as `calendar` above.
	iconPicker: {
		selectIcon: `Select an icon`,
		searchPlaceholder: `Search icons...`,
		iconsCount: `icons`,
		noIconsFound: `No icons found`,
		tryDifferentSearch: `Try a different search term`,
		selected: `Selected:`,
		icon: `Icon`,
		selectIconPlaceholder: `Select an icon`,
		solid: `Solid`,
		regular: `Regular`,
		brands: `Brands`,
	},
}
export default common
