const googleCalendar = {
	googleCalendar: {
		title: `Google Kalendár`,
		connect: `Prepojiť`,
		connected: `Prepojený`,
		notConnected: `Neprepojený`,
		notAvailable: `Tu nie je k dispozícii`,
		disconnect: `Odpojiť`,
		sync: `Synchronizovať`,
		// one | few | many — see the Slovak plural rule in src/i18n.ts.
		syncSuccess: `{count} úloha synchronizovaná do Google Kalendára | {count} úlohy synchronizované do Google Kalendára | {count} úloh synchronizovaných do Google Kalendára`,
		// Events of tasks skipped or made background since the last sync.
		syncRemoved: `{count} udalosť odstránená | {count} udalosti odstránené | {count} udalostí odstránených`,
		syncSummary: `{synced} · {removed}`,
		connectSuccess: `Google Kalendár úspešne prepojený`,
		connectFailed: `Nepodarilo sa prepojiť Google Kalendár`,
		connectCancelled: `Prepojenie Google Kalendára bolo zrušené`,
		connectExpired: `Pokus o prepojenie vypršal — začnite odznova`,
		connectRejected: `Google prepojenie odmietol — skúste to znova`,
		disconnectSuccess: `Google Kalendár odpojený`,
		syncFailed: `Nepodarilo sa synchronizovať do Google Kalendára`,
	},
}
export default googleCalendar
