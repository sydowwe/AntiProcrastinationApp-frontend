const activity = {
	alarm: {
		isActive: `Aktívny`,
	},
	activities: {
		role: `Roľa`,
		category: `Kategória`,
		activity: `Aktivita`,
		activityRequired: `* Aktivita`,
		activityDescription: `Popis aktivity`,
		isActivityUnavoidable: `Je aktivita nevyhnutná`,
		unavoidable: `Nevyhnutná`,
		placeOnToDoList: `Pridať na to-do list`,
		//===============================
		fromToDoList: `Je z to-do listu`,
		fromRoutineToDoList: `Je z rutinného to-do listu`,
		createNewActivity: `Vytvoriť novú aktivitu`,
		editActivity: `Upraviť aktivitu`,

		start: `Začať`,
		pause: `Pozastaviť`,
		stop: `Ukončiť`,
		saveActivity: `Uložiť aktivitu`,
		recordNewActivity: `Zaznamenať novú aktivitu`,
		confirmSaveActivity: `Potvrdiť uloženie aktivity "{activity}" - vykonané za {timeSpent}?`,
		quickEditActivity: `Rýchla úprava aktivity`,
		quickCreateActivityWithRole: `Rýchle vytvorenie aktivity s roľou "{role}"`,
		quickEditMode: `Režim rýchlej úpravy`,
		overwrite: `Prepísať`,
		clone: `Klonovať`,
		pleaseSelectActivity: `Prosím vyberte aktivitu`,
		activityNotFound: `Aktivita s id {id} sa nenašla`,
		// Názvy troch systémových rolí, pod ktoré padne rýchlo vytvorená aktivita. Kľúče sú hodnoty
		// SystemActivityRole — samotná roľa sa v databáze môže volať akokoľvek, tu je len jej označenie.
		systemRole: {
			routineTask: `Rutinná úloha`,
			todoListTask: `Úloha z to-do listu`,
			plannerTask: `Úloha z plánovača`,
		},
		systemRoleMissing: `Roľa „{role}“ sa nenašla, takže aktivita nebola vytvorená. Skontrolujte ju v nastaveniach rolí.`,
		copySuffix: ` - kópia`,

		//=========
		recentlyUsed: `Naposledy použité`,
		allActivities: `Všetky aktivity`,
		narrowedBy: `Zúžené na:`,
		clearNarrowing: `Zrušiť zúženie „{name}“`,
		createNamedActivity: `Vytvoriť aktivitu „{name}“`,
		noActivitiesYet: `Aktivity sa vytvárajú v nastaveniach aktivít.`,
		noActivitiesYetCreatable: `Aktivity sa vytvárajú v nastaveniach aktivít alebo tlačidlom + vedľa tohto poľa.`,
		noActivityMatches: `Žiadna aktivita sa nevolá „{name}“.`,
		noActivitiesForNarrowing: `Zvolená roľa a kategória nemajú spoločnú žiadnu aktivitu.`,
		noActivitiesInTable: `Aktivita je to, čo si zaznamenávate — jedna položka, ktorú robíte opakovane.`,
		noRolesInTable: `Roľa je oblasť života, do ktorej aktivita patrí — napríklad práca, domácnosť alebo štúdium.`,
		noCategoriesInTable: `Kategória zoskupuje príbuzné aktivity v rámci jednej role.`,
		noResultsForFilter: `Filtru nezodpovedá žiadny záznam.`,

		//=========
		// Archivácia namiesto mazania. Archivovaná aktivita si necháva celú históriu, zmizne z ponúk
		// aktivít a v nastaveniach ju vidno po prepnutí filtra.
		archive: {
			archive: `Archivovať`,
			unarchive: `Vrátiť z archívu`,
			archived: `Aktivita „{name}“ je archivovaná.`,
			unarchived: `Aktivita „{name}“ je späť medzi aktívnymi.`,
			archivedRow: `Archivovaná — neponúka sa pri zaznamenávaní.`,
			// Prečo je kôš neaktívny. Mazanie je povolené iba pri aktivite, na ktorú nič neodkazuje.
			deleteBlocked: `Vymazať sa dá len aktivita, na ktorú nič neodkazuje. Túto archivujte.`,
			usageCount: `Záznamy`,
			noneArchived: `Zatiaľ nie je archivovaná žiadna aktivita.`,
			viewActive: `Aktívne`,
			viewArchived: `Archivované`,
			viewAll: `Všetky`,
		},
		// Zlúčenie duplicitných aktivít. Nezvratné — potvrdenie je jediná poistka.
		merge: {
			title: `Zlúčiť aktivity`,
			action: `Zlúčiť`,
			confirmTitle: `Potvrdenie zlúčenia`,
			selectedCount: `Vybrané: {count}`,
			needsTwo: `Zlúčiť sa dajú aspoň dve aktivity.`,
			explanation: `Vyberte aktivitu, ktorá zostane. Všetko, čo odkazuje na ostatné — história, úlohy z to-do listu, úlohy v plánovači aj priradenia zo sledovania — sa prepojí na ňu a ostatné aktivity zaniknú.`,
			// Ak ten istý riadok odkazuje na dve zlučované aktivity, zostane z toho jeden odkaz. Číslo nižšie
			// je preto horná hranica a snackbar po zlúčení môže hlásiť menej — bez tejto vety to vyzerá ako chyba.
			collapseNote: `Ak na dve zlučované aktivity odkazuje ten istý riadok, zostane z toho jediný odkaz — prenesených záznamov tak môže byť menej.`,
			// Tvary sú v genitíve, lebo vetu uvádza „Zlúčenie …“ — poradie je jednotné | 2–4 | 5+.
			activityCount: `{count} aktivity | {count} aktivít | {count} aktivít`,
			recordCount: `{count} záznamu | {count} záznamov | {count} záznamov`,
			outcome: `Zlúčenie do aktivity „{survivor}“ — {activities} a {records}.`,
			irreversible: `Túto akciu nemožno vrátiť späť.`,
			success: `Zlúčenie do aktivity „{survivor}“ prebehlo — {activities} a {records}.`,
		},

		//=========
		roles: `Role`,
		categories: `Kategórie`,
		activitiesTab: `Aktivity`,
		color: `Farba`,
		icon: `Ikona`,
		nameRequired: `* Názov`,
		editRole: `Upraviť rolu`,
		addNewRole: `Pridať novú rolu`,
		editCategory: `Upraviť kategóriu`,
		addNewCategory: `Pridať novú kategóriu`,

		//=========
		enableNotificationsInWindows: `V systéme Windows prejdite na Nastavenia > Systém > Oznámenia a akcie > V sekcii Získať oznámenia a akcie od týchto odosielateľov vyberte Google Chrome.`,
	},
	pomodoroTimer: {
		hint: ``,
		focusTime: `Čas pre sústredenie`,
		shortRestTime: `Čas pre krátky oddych`,
		longRestTime: `Čas pre dlhý oddych`,
		numberOfCycles: `Počet cyklov`,
		numberOfFocusIntervalsInCycle: `Počet intervalov sústredenia v cykle`,
		focus: `Koncentrácia`,
		shortRest: `Krátky oddych`,
		longRest: `Dlhý oddych`,
		settings: `Nastavenia`,
		presets: `Predvoľby`,
		autoStartBreaks: `Automaticky spustiť prestávky`,
		autoStartFocus: `Automaticky spustiť sústredenie`,
		soundEnabled: `Zvukové upozornenia povolené`,
		focusActivity: `Aktivita pre sústredenie`,
		restActivity: `Aktivita pre oddych`,
	},
}
export default activity
