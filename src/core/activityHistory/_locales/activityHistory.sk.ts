const activityHistory = {
	history: {
		recordActivityToHistory: `Zaznamenať aktivitu do histórie`,
		lengthNotSet: `Nebola zadaná dĺžka`,
		addedToHistory: `Záznam aktivity "{activity}" bol pridaný do histórie`,
		errorSavingToHistory: `Chyba pri ukladaní záznamu aktivity "{activity}" do histórie`,

		selectDatePlease: `Prosím vyberte dátum`,
		noPresetsYet: `Zatiaľ žiadne predvoľby`,
		timerPresetsTitle: `Predvoľby časovača`,
		quickTimes: `Rýchle časy`,
		activityPresets: `Predvoľby aktivít`,
		confirmDeletePreset: `Naozaj chcete vymazať túto predvoľbu?`,
		confirmDeleteNamedPreset: `Naozaj chcete vymazať predvoľbu „{name}“?`,
		logTaskTitle: `Zaznamenať úlohu: {activity}`,
		taskDoneFor: `Úloha trvala {duration}`,
		historyUpdated: `Záznam histórie bol upravený`,
		historyUpdateFailed: `Úprava záznamu histórie zlyhala`,
		// Vloží sa do general.deleteConfirmationText ("Ste si istý, že chcete vymazať {name}?"), takže
		// musí byť v akuzatíve.
		recordNounAccusative: `tento záznam aktivity`,

		summary: {
			title: `História aktivít`,
			dayFrom: `Deň od`,
			openCalendar: `Otvoriť kalendár`,
		},
		detail: {
			title: `Detail histórie`,
			openCalendar: `Otvoriť kalendár`,
			openSummary: `Späť na súhrn za tento týždeň`,
		},
		calendar: {
			sessions: `{count} relácia | {count} relácie | {count} relácií`,
			noActivity: `Žiadna aktivita`,
			notRecorded: `Nezaznamenané`,
			noActivityInRange: `V zobrazenom rozsahu nie je zaznamenaná žiadna aktivita.`,
		},
		timer: {
			setDurationFirst: `Prosím nastavte dĺžku časovača`,
			endedTitleAnim: `Časovač skončil!`,
			endedNotifTitle: `Časovač skončil`,
			endedNotifBody: `Váš časovač pre {activity} skončil — bežal {duration}.`,
		},
		pomodoroPreset: {
			editTitle: `Upraviť pomodoro predvoľbu`,
			addTitle: `Pridať pomodoro predvoľbu`,
			tabBasic: `Základné`,
			tabWithFocus: `S aktivitou sústredenia`,
			tabWithBoth: `S oboma aktivitami`,
			name: `Názov predvoľby`,
			defaultName: `Pomodoro predvoľba`,
			timerDurations: `Dĺžky časovača`,
			focusLabel: `Sústredenie`,
			shortBreakLabel: `Krátka prestávka`,
			longBreakLabel: `Dlhá prestávka`,
			cycleSettings: `Nastavenia cyklu`,
			focusPeriodsPerCycle: `Počet intervalov sústredenia na cyklus`,
		},
		timerPreset: {
			editTitle: `Upraviť predvoľbu časovača`,
			addTitle: `Pridať predvoľbu časovača`,
		},
		// Texty notifikácií a titulku okna pomodoro časovača. `cycleInfo`/`focusInfo` sú preložené
		// fragmenty postavené z cycleProgress/focusProgress a vložené ako parameter — nie zreťazenie,
		// pozri PomodoroTimerView.vue.
		pomodoro: {
			title: `Pomodoro časovač`,
			defaults: `Predvolené`,
			cycleProgress: `Cyklus {current}/{total}`,
			focusProgress: `Sústredenie {current}/{total}`,
			focusEndedTitleAnim: `Sústredenie skončilo!`,
			timeForBreak: `Čas na prestávku`,
			focusPeriodEndedTitle: `Perióda sústredenia skončila`,
			focusPeriodEndedBody: `{activity} · {focusInfo} · {cycleInfo}. Čas na prestávku!`,
			breakEndedTitleAnim: `Prestávka skončila!`,
			timeToFocus: `Čas sústrediť sa`,
			shortBreakEndedTitle: `Krátka prestávka skončila`,
			shortBreakEndedBody: `{cycleInfo} — čas sústrediť sa na {activity}!`,
			longBreakEndedTitleAnim: `Dlhá prestávka skončila!`,
			startingCycle: `Začína cyklus {n}`,
			longBreakEndedTitle: `Dlhá prestávka skončila`,
			longBreakEndedBody: `Cyklus {current} dokončený. Čas na cyklus {next}!`,
			completeCycleCount: `{count} cyklus | {count} cykly | {count} cyklov`,
			completeTitleAnim: `🍅 Pomodoro dokončené! · {cycleCount}`,
			completeSubtitle: `{activity} - {duration}`,
			completeNotifTitle: `Pomodoro dokončené!`,
			doneSummary: `{count} cyklus dokončený! Sústredenie na {activity} trvalo {duration} | {count} cykly dokončené! Sústredenie na {activity} trvalo {duration} | {count} cyklov dokončených! Sústredenie na {activity} trvalo {duration}`,
			restedWith: `, odpočinok pri {activity}`,
			// Vždy pripojené za doneSummary/restedWith, aj keď nebola vybraná aktivita na odpočinok —
			// zrkadlí pôvodné (mierne čudné) anglické správanie, tento prechod ho nemení.
			forDuration: ` po dobu {duration}`,
		},
	},
}
export default activityHistory
