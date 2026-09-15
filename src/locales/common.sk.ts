// App-wide namespaces not owned by a single core module — the app-level counterpart of
// @/_common/_locales/common.sk.ts. How the two meet is decided in `SK.ts`: `general`, `dateTime`
// and `controls` are DEEP-MERGED (framework keys survive, this app wins collisions), so a key only
// needs to be here when this app wants a different wording or the framework has no such key.
// `navigation` and `app` replace the framework's wholesale — its copies are another app's.
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
	// Deep-merged over the framework's `general` in `SK.ts` — only this app's own keys and its
	// deliberate rewordings live here; anything identical to the framework's copy was deleted (F35).
	general: {
		or: `Alebo`,
		please: `Prosím`,
		close: `Zavrieť`,
		create: `Vytvoriť`,
		filter: `Filtrovať`,
		// Prístupné názvy pre tlačidlá, ktoré nesú iba ikonu.
		toggleSortDirection: `Zmeniť smer zoradenia`,
		moreActions: `Ďalšie akcie`,
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
		nothingToUndo: `Nie je čo vrátiť späť`,
		// This app's wording; the framework says "Začiatok" (a noun — this is the timer's verb).
		start: `Začať`,
		// The skip link in `App.vue` — the first tab stop on every page.
		skipToContent: `Preskočiť na obsah`,
		backHome: `Späť domov`,
	},
	// The catch-all route (`src/router.ts`) — rendered for any URL no module claims.
	notFound: {
		title: `Stránka sa nenašla`,
		text: `Táto adresa nevedie nikam. Skontrolujte odkaz alebo sa vráťte na domovskú stránku.`,
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
		// Deep-merged over the framework's `dateTime` in `SK.ts` (F35) — the keys the framework's
		// `DateRangePicker` / `MonthYearPicker` / `TimeDisplay` / `TimeRangePicker` resolve come from
		// its own file now. Only this app's deliberate rewordings stay:
		switchToTimeRange: `Prepnúť na rozsah času`,
		switchToDuration: `Prepnúť na dĺžku`,
		// Deliberately not the framework's wording, which hardcodes "31 dní" — `maxDays` is a prop and
		// this app passes 366 for the activity dashboards.
		dateRangeExceedsLimit: `Zvolený rozsah dátumov je príliš dlhý`,
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
