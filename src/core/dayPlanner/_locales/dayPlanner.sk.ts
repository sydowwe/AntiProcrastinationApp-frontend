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
	},
}
export default dayPlanner
