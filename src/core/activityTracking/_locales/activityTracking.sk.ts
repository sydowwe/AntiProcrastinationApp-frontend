const messages = {
	tracker: {
		stackedBars: `Stĺpcový graf`,
		timeline: `Časová os`,
	},
	dashboard: {
		title: `Prehľad aktivít`,
		desktopTitle: `Aktivita na počítači`,
		androidTitle: `Aktivita na Androide`,
		unifiedTitle: `Celý deň`,
		topProcesses: `Top procesy`,
		topApps: `Top aplikácie`,
		topDomains: `Top domény`,
		// Zlúčený pohľad mieša domény, procesy aj aplikácie, takže žiadny z troch názvov vyššie
		// nesedí — „položky“ je jediné slovo, ktoré pokrýva všetky tri.
		topItems: `Top položky`,
		comparedTo: `Porovnať s`,
	},
	sources: {
		title: `Zdroje`,
		webExtension: `Prehliadač`,
		desktop: `Počítač`,
		android: `Telefón`,
		noData: `bez dát`,
		include: `Pridať zdroj {source}`,
		exclude: `Odobrať zdroj {source}`,
		keepOne: `Aspoň jeden zdroj musí zostať zapnutý`,
		// Text, ktorý zabraňuje tomu, aby zlúčený súčet vyzeral ako chyba: čas nezmizol ani sa
		// nerozpolil, len je započítaný raz.
		overlapNote: `{value} zaznamenali dva zdroje naraz a je započítaný raz.`,
		displaced: `{value} zo zdroja {source} je pripísaných zdroju {target}`,
		overlapRule: `Pri prekryve má prednosť čas v popredí pred časom na pozadí; inak rozhoduje konkrétnejší zdroj — prehliadač, potom počítač, potom telefón.`,
	},
	baseline: {
		last7Days: `Posledných 7 dní`,
		last30Days: `Posledných 30 dní`,
		sameWeekday: `Rovnaký deň v týždni`,
		allTime: `Celé obdobie`,
	},
	range: {
		today: `Dnes`,
		last7Days: `Posledných 7 dní`,
		thisWeek: `Tento týždeň`,
		last30Days: `Posledných 30 dní`,
		custom: `Vlastné`,
		timelineUnavailable: `Časová os je dostupná len pre jeden deň`,
		timelineFellBack: `Pre viacdňový rozsah sa zobrazuje stĺpcový graf`,
	},
	common: {
		noActivityRecorded: `Za toto obdobie nebola zaznamenaná žiadna aktivita`,
		emptyInWindow: `V tomto časovom okne nie je žiadna aktivita`,
		emptyInWindowHint: `Tento deň má záznamy mimo zvoleného rozsahu 07:00 – 00:00`,
		emptyInWindowHintRange: `Toto obdobie má záznamy mimo zvoleného denného rozsahu 07:00 – 00:00`,
		showWholeDay: `Zobraziť celý deň`,
		showWholeDays: `Zobraziť celé dni`,
		emptyDay: `Za tento deň nie sú zaznamenané žiadne dáta`,
		emptyRange: `Za toto obdobie nie sú zaznamenané žiadne dáta`,
		checkSourceSettings: `Skontrolovať pripojenie zdroja`,
		noDataForPeriod: `Za toto obdobie nie sú žiadne dáta`,
		noActivity: `Žiadna aktivita`,
		totalTime: `Celkový čas:`,
		total: `Spolu:`,
		active: `Aktívne:`,
		background: `Na pozadí:`,
		entries: `Záznamy:`,
		other: `Ostatné`,
		showLess: `- Zobraziť menej`,
		showMore: `+ {count} ďalších`,
		loadFailed: `Načítanie zlyhalo`,
		retry: `Skúsiť znova`,
	},
	pieChart: {
		dayTotal: `Celkovo za deň`,
		rangeTotal: `Celkovo za obdobie`,
		details: `Detaily`,
		domains: `Domény:`,
		pages: `Stránky:`,
		visits: `Návštevy:`,
		apps: `Aplikácie:`,
		sessions: `Relácie:`,
		processes: `Procesy:`,
		items: `Položky:`,
		recordedBy: `Zaznamenali:`,
		windowTitles: `Názvy okien:`,
		fullscreen: `Na celú obrazovku:`,
		playingSound: `Prehrávanie zvuku:`,
		monitorBreakdown: `Rozdelenie podľa monitora:`,
		monitor: `Monitor {n}:`,
		closeDomainDetails: `Zavrieť detaily domény`,
	},
	viewMode: {
		total: `Celkovo`,
		active: `Aktívne`,
		background: `Na pozadí`,
	},
	statColumn: {
		new: `NOVÉ`,
		noChange: `Bez zmeny oproti priemeru`,
		aboveAverage: `{percent} % nad priemerom`,
		belowAverage: `{percent} % pod priemerom`,
		viewDetails: `Zobraziť detaily pre {domain}`,
	},
	stackedBars: {
		windowLabel: `Okno`,
	},
	focus: {
		title: `Priebeh dňa`,
		switches: `Prepnutia`,
		switchesHint: `Koľkokrát sa počas dňa zmenilo to, čo bolo v popredí.`,
		longestBlock: `Najdlhší súvislý blok`,
		longestBlockHint: `Najdlhší čas strávený na jednej položke. Krátke prerušenia do {minutes} min blok neukončia.`,
		medianSession: `Typická relácia`,
		medianSessionHint: `Medián dĺžky relácií. Medián namiesto priemeru — niekoľko dlhých relácií priemer skreslí.`,
		// Tvar `Relácie: {count}` namiesto `z {count} relácií` — slovenčina má tri tvary množného
		// čísla a bez pluralizačného pravidla by `z 1 relácií` bolo gramaticky nesprávne.
		sessionCount: `Relácie: {count}`,
		longestBreak: `Najdlhšia pauza`,
		longestBreakHint: `Najdlhší úsek medzi dvoma reláciami bez zaznamenanej aktivity.`,
		// Porovnanie s vlastnou nedávnou históriou používateľa — zámerne bez percent, šípky a farby.
		// Je to opis, nie hodnotenie dňa.
		comparison: `zvyčajne {value}`,
		// Rovnaký tvar ako pri sessionCount vyššie: hodnota na deň bez skloňovaného počítaného slova.
		perDay: `{value} / deň`,
	},
	timeline: {
		title: `Časová os aktivity`,
		single: `Jednoduché`,
		split: `Rozdelené`,
		start: `Začiatok:`,
		end: `Koniec:`,
		duration: `Trvanie:`,
		activeTime: `Aktívny čas:`,
	},
	settings: {
		desktopTitle: `Jedinečné záznamy procesov`,
		androidTitle: `Jedinečné záznamy aplikácií`,
		distinctEntries: `Jedinečné záznamy`,
		mappings: `Mapovania`,
		toActivity: `Na aktivitu`,
		toIgnored: `Na ignorované`,
		hintText: `Pomocou polí filtra definujte vzor zhody, potom vyberte aktivitu alebo označte ako ignorované a kliknite na {save}. Filter sa stane pravidlom – budúce záznamy, ktoré mu zodpovedajú, budú namapované automaticky. Ak chcete upraviť existujúce pravidlo, otvorte záložku {mappingsTab} a kliknite na upraviť.`,
		failedToSaveMapping: `Uloženie mapovania zlyhalo`,
		failedToLoadDistinctEntries: `Načítanie jedinečných záznamov zlyhalo`,
		failedToLoadMappings: `Načítanie mapovaní zlyhalo`,
		processName: `Názov procesu`,
		productName: `Názov produktu`,
		windowTitle: `Názov okna`,
		appLabel: `Názov aplikácie`,
		packageName: `Názov balíka`,
		isActive: `Je aktívne`,
		isIgnored: `Je ignorované`,
		matchType: `Typ zhody`,
		type: `Typ`,
	},
}
/**
 * ONE root namespace, like every other module locale file in `src/core` (`planner`, `toDoList`,
 * `leisure`, `home`, …). `src/locales/SK.ts` spreads this object's **top level** into the root, so
 * this wrapper is what makes `$t('activityTracking.…')` resolve.
 *
 * Without it the twelve groups above each became a root namespace of their own — `tracker`,
 * `dashboard`, `common`, `settings`, `timeline`, … — and every one of the module's ~34
 * `$t('activityTracking.*')` call sites rendered its raw key instead of a string. It also put a
 * bare `common` and a bare `settings` in the app's root namespace, one shallow-spread collision away
 * from replacing another module's, which is the hazard the comment at the top of `SK.ts` describes.
 */
const activityTracking = { activityTracking: messages }
export default activityTracking
