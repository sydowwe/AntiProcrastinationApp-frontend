// App-wide namespaces not owned by a single core module — the app-level counterpart of
// @/_common/_locales/common.sk.ts. Spread after the framework's `common` in the SK aggregator so
// this app's `navigation`/`general`/`dateTime`/`controls` win the collision (see SK.ts).
const common = {
	navigation: {
		home: `Domov`,
		toDoList: `To-do list`,
		routineToDoList: `Rutina`,
		createNewActivity: `Vytvoriť nový druh aktivity`,
		history: `História`,
		historySummary: `Súhrn`,
		historyCalendar: `Kalendár`,
		unifiedActivityTracking: `Všetky zdroje`,
		activityTracking: `Web tracking`,
		desktopActivityTracking: `Desktop tracking`,
		androidActivityTracking: `Android tracking`,
		recordActivity: `Zaznamenať aktivitu`,
		recordActivityManually: `Manuálne`,
		pomodoroTimer: `Pomodoro časovač`,
		stopwatch: `Stopky`,
		timer: `Časovač`,
		alarm: `Alarm`,
		taskPlanner: `Plánovač`,
		dayPlanner: `Plánovač dňa`,
		templateDayPlanner: `Plánovač dňa - template`,
		dayPlannerSettings: `Nastavenia plánovača`,
		desktopSettings: `Nastavenia desktopu`,
		androidSettings: `Nastavenia androidu`,
		activitySettings: `Nastavenia aktivít`,
		leisure: `Voľný čas`,
		leisurePicker: `Čo mám robiť?`,
		backlog: `Zásobník`,
		projects: `Projekty`,
		bucketList: `Bucket list`,
		memoryAnchors: `Pamätné momenty`,
		// Not a sidebar item — the framework's UserMenu links to it by this key.
		myReminders: `Moje pripomienky`,
		reminders: `Pripomienky`,
		reminderDefinitions: `Register pripomienok`,
		reminderUpcoming: `Nadchádzajúce`,
		reminderOverview: `Prehľad`,
		reminderDispatchHistory: `História odoslaní`,
		scheduler: `Plánovač úloh`,
		schedulerJobs: `Naplánované úlohy`,
		schedulerNeedsAttention: `Vyžaduje pozornosť`,
	},
	// Replaces the framework's `app` namespace, which carries the reference app's brand name.
	// Rendered in the top bar. `brandName` is the framework's only key there, so nothing is lost to
	// the shallow spread in SK.ts.
	app: {
		brandName: `Adhd time organizer`,
	},
	general: {
		// Used by the framework's TableHeaderComposable; the app's `general` namespace replaces the
		// framework's wholesale (see the note at the top of SK.ts), so it has to be repeated here.
		actions: `Akcie`,
		or: `Alebo`,
		// Joins the two legal links in the framework's registration checkbox — same reason as
		// `actions` above: this namespace replaces the framework's wholesale.
		and: `a`,
		please: `Prosím`,
		close: `Zavrieť`,
		create: `Vytvoriť`,
		filter: `Filtrovať`,
		send: `Odoslať`,
		save: `Uložiť`,
		cancel: `Zrušiť`,
		edit: `Upraviť`,
		add: `Pridať`,
		iAgreeTo: 'Súhlasím s',
		name: `Názov`,
		text: `Text`,
		continue: `Pokračovať`,
		done: `Hotovo`,
		error: `Chyba`,
		select: `Vybrať`,
		unselect: `Zrušiť výber`,
		delete: `Vymazať`,
		clear: `Vynulovať`,
		task: `Úloha`,
		hide: `Skryť`,
		show: `Zobraziť`,
		confirm: `Potvrdiť`,
		new: `Nový`,
		update: `Aktualizovať`,
		optional: `Voliteľné`,
		search: `Hľadať`,
		uncategorized: `Bez kategórie`,
		all: `Všetky`,
		addToPlanner: `Pridať do plánovača`,
		logTime: `Zaznamenať čas`,
		moveToList: `Presunúť do zoznamu`,
		// Same story as `actions` above: the framework's `general.backToList` (reminders' definition
		// detail, and now the scheduler's job/run detail views) is wholesale-replaced by this
		// namespace, so it has to be repeated here too — otherwise it silently falls back to the EN
		// string via `fallbackLocale`, showing English text on an SK page. Discovered while adding
		// the scheduler EN locale (S2), which is what first gave this key an EN counterpart to fall
		// back to.
		backToList: `Späť na zoznam`,
		// Used by the framework's useUndoStack. The app's `general` namespace replaces the framework's
		// wholesale (see the note at the top of SK.ts), so its copy of this key never reaches i18n.
		undoSuccess: `{description} bolo vrátené späť`,
		// Same story: BasicTable's and TableGrid's built-in delete dialogs resolve these two, and so does
		// every app-side `useDialog().confirm` for a delete. Without the mirror they render the raw key —
		// which is what every table in the app did until this was noticed (migration-revision.md R5/R6/R11
		// are the same defect three times over).
		deleteConfirmationTitle: `Potvrdenie vymazania`,
		deleteConfirmationText: `Ste si istý, že chcete vymazať {name}?`,
		// Same story again, with a twist: `general.retry` (the retry button on the scheduler's two
		// detail pages, S1) and `general.forbidden` (their non-admin card) existed in NO locale at all
		// — `retry` is only defined under the framework's `notifications` namespace, and the
		// framework's `general.forbidden` is wholesale-replaced by this one. The retry button has been
		// rendering the raw key `GENERAL.RETRY` since S1 shipped; found while browser-verifying S4.
		retry: `Skúsiť znova`,
		forbidden: `Nemáte oprávnenie na zobrazenie tejto stránky.`,
	},
	dateTime: {
		when: `Kedy`,
		length: `Dĺžka`,
		lengthRequired: `Dĺžka musí byť väčšia ako 0`,
		date: `Dátum`,
		time: `Čas`,
		year: `Rok`,
		month: `Mesiac`,
		day: `Deň`,
		hour: `Hodina`,
		minute: `Minúta`,
		second: `Sekunda`,
		hours: `Hodiny`,
		minutes: `Minúty`,
		seconds: `Sekundy`,
		dateFrom: `Dátum od`,
		dateTo: `Dátum do`,
		howManyHoursBack: `Koľko hodín späť`,
		dateRange: `Rozmedzie dátumov`,
		hoursBack: `Hodín späť`,
		today: `Dnes`,
		// --- Mirrored from `_common/_locales/common.sk.ts` ---
		// `SK.ts` spreads this app's `dateTime` AFTER the framework's, and the spread is shallow, so
		// this namespace replaces the framework's wholesale rather than merging with it. Every key
		// below is one the framework's own `DateRangePicker` / `MonthYearPicker` resolve; without the
		// mirror they render as raw `dateTime.mode` strings in this app. Adopting either component was
		// what surfaced it (activityTracking U3) — the same omission as `migration-revision.md` R5/R6/R11.
		mode: `Režim`,
		range: `Rozsah`,
		duration: `Trvanie`,
		anchor: `Kotviaci bod`,
		unit: `Jednotka`,
		quantity: `Počet`,
		fromStart: `Od začiatku`,
		toEnd: `Do konca`,
		daysPlural: `Dni`,
		weeksPlural: `Týždne`,
		// Deliberately not the framework's wording, which hardcodes "31 dní" — `maxDays` is a prop and
		// this app passes 366 for the activity dashboards.
		dateRangeExceedsLimit: `Zvolený rozsah dátumov je príliš dlhý`,
		startDateBeforeEndDate: `Dátum od musí byť pred dátumom do`,
		january: `Január`,
		february: `Február`,
		march: `Marec`,
		april: `Apríl`,
		may: `Máj`,
		june: `Jún`,
		july: `Júl`,
		august: `August`,
		september: `September`,
		october: `Október`,
		november: `November`,
		december: `December`,
	},
	controls: {
		start: `Štart`,
		pause: `Pauza`,
		stop: `Stop`,
		reset: `Reset`,
		resetToDefaults: `Reset na pôvodné`,
		presets: `Presets`,
		settings: `Nastavenia`,
		edit: `Upraviť`,
	},
	successFeedback: {
		added: `Pridané`,
		edited: `Upravené`,
		deleted: `Vymazané`,
		moved: `Úspešne presunuté`,
	},
	theme: {
		label: `Téma`,
		light: `Svetlá`,
		dark: `Tmavá`,
		system: `Systémová`,
		switchToLight: `Prepnúť na svetlý režim`,
		switchToDark: `Prepnúť na tmavý režim`,
	},
	locales: {
		SK: `Slovenčina`,
		EN: `Angličtina`,
		CZ: `Čeština`,
	},
	weekdays: {
		short: {
			mon: `Po`,
			sun: `Ne`,
		},
	},
}
export default common
