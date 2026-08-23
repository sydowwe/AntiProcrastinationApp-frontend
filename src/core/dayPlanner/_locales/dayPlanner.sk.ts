const dayPlanner = {
	planner: {
		task: `Aktivita`,
		quickCreatePlannerActivity: `Rýchle vytvorenie aktivity v plánovači`,
		quickEditPlannerActivity: `Rýchla úprava aktivity`,
		importance: `Dôležitosť`,
		ignore: `Ignorovať`,
		overwrite: `Prepísať`,
		mergeIgnore: `Zlúčiť a ignorovať`,
		mergeOverwrite: `Zlúčiť a prepísať`,
		status: {
			notStarted: `Nezačaté`,
			inProgress: `Prebieha`,
			onHold: `Pozastavené`,
			completed: `Dokončené`,
			cancelled: `Zrušené`,
		},
		// B2: these two planner settings are not a reminder kill switch — the copy used to say they
		// were. They drive the in-tab nudge and the default lead time for task-linked reminders; only
		// the reminder preferences page can stop a reminder from being delivered.
		nudges: {
			tab: `Upozornenia v aplikácii`,
			enable: `Upozorniť ma pred začiatkom aktivity`,
			leadLabel: `Predstih`,
			minutesSuffix: `min`,
			explainer: `Toto upozornenie sa zobrazí len vtedy, keď máte plánovač otvorený v prehliadači. Rovnaký predstih sa použije aj ako predvolený, keď si k aktivite vytvoríte pripomienku bez zadaného času.`,
			realRemindersHint: `Pripomienky doručované aj so zavretou aplikáciou — vrátane ich úplného vypnutia a tichých hodín — nastavíte v sekcii`,
			reminderPreferencesLink: `Predvoľby pripomienok`,
		},
		templateSuggestions: {
			suggestedForYou: `Odporúčané pre vás`,
			usedOn: `Použité v {label}`,
			timesCount: `{count}×`,
		},
		// Zvyšok `TemplateListView.vue` je zatiaľ natvrdo po anglicky; localizované sú len tieto
		// kľúče, lebo mazanie šablóny je nevratné a text musí byť presný.
		templateDelete: {
			title: `Vymazať šablónu?`,
			body: `Šablónu „{name}“ nebude možné obnoviť.`,
			cascade: `Počet úloh v šablóne: {count}. Vymažú sa spolu s ňou.`,
		},
		// Zámerne bez skloňovania počtu tam, kde ide o hlásenie čiastočného zlyhania (X/Y) — rovnaký
		// trik ako templateDelete.cascade, aby sa predišlo štvortvarovej skloňovacej zhode s dvomi čísla.
		feedback: {
			selectTemplateFirst: `Najprv vyberte šablónu`,
			templateApplied: `Šablóna použitá`,
			templateApplyFailed: `Šablónu sa nepodarilo použiť`,
			// Tvary v poradí 1 | 2–4 | 0 a 5+ (pravidlo v src/i18n.ts).
			bulkTemplateApplied: `Šablóna použitá pre {count} deň | Šablóna použitá pre {count} dni | Šablóna použitá pre {count} dní`,
			bulkTemplateApplyPartial: `Šablóna použitá — úspešných dní: {succeeded}/{total}, zlyhalo: {failed}`,
			dayTypeUpdated: `Typ dňa aktualizovaný pre {count} deň | Typ dňa aktualizovaný pre {count} dni | Typ dňa aktualizovaný pre {count} dní`,
			dayTypeUpdatePartial: `Typ dňa aktualizovaný — úspešných dní: {succeeded}/{total}, zlyhalo: {failed}`,
			tasksCopied: `Úlohy skopírované pre {count} deň | Úlohy skopírované pre {count} dni | Úlohy skopírované pre {count} dní`,
			tasksCopyPartial: `Skopírovaných úloh: {succeeded}/{total}, zlyhalo: {failed}`,
			tasksCopyFailed: `Kopírovanie úloh zlyhalo`,
			taskStatusUpdateFailed: `Zmenu stavu sa nepodarilo uložiť`,
			statusUpdated: `1 úloha aktualizovaná | {count} úlohy aktualizované | {count} úloh aktualizovaných`,
			statusUpdatePartial: `Zmena stavu — úspešných úloh: {succeeded}/{total}, zlyhalo: {failed}`,
			taskSkipped: `1 úloha preskočená | {count} úlohy preskočené | {count} úloh preskočených`,
			taskSkipPartial: `Preskočených úloh: {succeeded}/{total}, zlyhalo: {failed}`,
			tasksRescheduled: `1 úloha preplánovaná | {count} úlohy preplánované | {count} úloh preplánovaných`,
			taskReschedulePartial: `Preplánovaných úloh: {succeeded}/{total}, zlyhalo: {failed}`,
		},
	},
}
export default dayPlanner
