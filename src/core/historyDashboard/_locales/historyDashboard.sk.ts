const messages = {
	dateRange: {
		rangeLength: `Dĺžka rozsahu`,
		from: `Od`,
		to: `Do`,
		threeDays: `3 dni`,
		sevenDays: `7 dní`,
		twoWeeks: `2 týždne`,
		month: `Mesiac`,
		threeMonths: `3 mesiace`,
		year: `Rok`,
		customRange: `Vlastný rozsah`,
		rangeInverted: `Dátum „Do“ musí byť rovnaký alebo neskorší ako „Od“`,
		rangeTooLong: `Vlastný rozsah môže mať najviac {max} dní`,
	},
	summaryCards: {
		topGroup: `Top {group}`,
		show: `Zobraziť`,
		total: `Spolu`,
		// OP14: základ, voči ktorému sa počíta percento, prepočítaný na zvolené obdobie.
		usually: `zvyčajne {duration}`,
		// Karta je prepínač, ktorý zvýrazní výsek v grafe — nič neotvára (F30).
		viewDetails: `Zvýrazniť {name} v grafe`,
		// Kľúčované podľa hodnôt enumu HistoryGroupBy.
		groupLabel: {
			ACTIVITY: `Aktivity`,
			ROLE: `Role`,
			CATEGORY: `Kategórie`,
		},
		// Názov prepínacej skupiny Aktivita/Rola/Kategória (F90).
		groupBy: `Zoskupiť podľa`,
	},
	periodBanner: {
		periodTotal: `Súčet obdobia:`,
		vsPrevious: `oproti predošlému:`,
		noBaseline: `bez porovnania`,
	},
	pieChart: {
		totalEntries: `Celkovo záznamov:`,
		uniqueGroups: `Unikátnych skupín:`,
		periodTotals: `Súčty obdobia`,
	},
	// H10. Jeden kľúč = jedna celá veta — čísla a názov skupiny sú v strede vety, takže sa interpolujú,
	// nikdy neskladajú z častí. Kľúčované podľa hodnôt HistoryInsightKind.
	insights: {
		title: `Postrehy`,
		sessionLength: `Zaznamenali ste {total} v {entries} záznamoch — v priemere {mean} na jeden.`,
		timeOfDay: `Medzi {from} a {to} ste zaznamenali {total} — {share} % z celého obdobia.`,
		// OP21: tá istá veta, keď API pošle, v koľkých dňoch sa pásmo použilo.
		timeOfDayFrequency: `Medzi {from} a {to} ste zaznamenali {total} — {share} % z celého obdobia — v {days} z {range} dní.`,
		mostFragmented: `Najviac rozdrobené je {name}: {total} v {entries} záznamoch, teda priemerne {mean} na jeden.`,
		longestStretches: `Najdlhšie súvislé úseky má {name}: {total} v {entries} záznamoch, teda priemerne {mean} na jeden.`,
	},
	timeline: {
		editTitle: `Upraviť záznam histórie`,
	},
	emptyState: {
		firstRunTitle: `Zatiaľ nemáte žiadne záznamy`,
		firstRunMessage: `Zaznamenajte aktivitu, ktorú ste už urobili, alebo spustite časovač pre to, čo robíte práve teraz.`,
		logManually: `Zaznamenať ručne`,
		startTimer: `Spustiť časovač`,
	},
	export: {
		xlsxUnavailable: `Export do Excelu zatiaľ nie je podporovaný — použite prosím CSV.`,
		error: `Export sa nepodarilo vytvoriť.`,
		summary: {
			fileNamePrefix: `historia-suhrn`,
			columns: {
				groupName: `Skupina`,
				totalSeconds: `Celkový čas (s)`,
				totalDuration: `Celkový čas`,
				entries: `Počet záznamov`,
				percentChange: `Zmena oproti porovnaniu (%)`,
			},
		},
		detail: {
			fileNamePrefix: `historia-detail`,
			columns: {
				start: `Začiatok`,
				end: `Koniec`,
				durationSeconds: `Trvanie (s)`,
				duration: `Trvanie`,
				activity: `Aktivita`,
				category: `Kategória`,
				role: `Rola`,
				notes: `Poznámka`,
				// Prázdne pri riadku zapísanom mimo relácie časovača.
				session: `Relácia časovača`,
				phase: `Fáza`,
				outcome: `Výsledok relácie`,
				// Čas sústredenia, na ktorý bol časovač relácie nastavený. Prázdne mimo relácie a pri starších.
				plannedSeconds: `Plánované sústredenie (s)`,
			},
		},
	},
}
/**
 * ONE root namespace, mirroring `activityTracking` — `src/locales/SK.ts` spreads this object's
 * top level into the root, so without the wrapper `dateRange`, `summaryCards`, `pieChart`, … would
 * each become a root namespace of their own, one shallow-spread collision away from replacing
 * another module's (see the comment at the top of SK.ts).
 */
const historyDashboard = { historyDashboard: messages }
export default historyDashboard
