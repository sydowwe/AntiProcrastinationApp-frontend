import { describe, expect, it } from 'vitest'
import i18n from '@/i18n.ts'

/**
 * Guards the one i18n rule in this app that is silently wrong rather than visibly missing.
 *
 * Slovak has three plural categories (1 / 2–4 / 5+), `src/i18n.ts` registers a custom `pluralRules`
 * for exactly that, and vue-i18n selects a form from `named.count` when no explicit plural index is
 * passed. A message written with two forms still *renders* — as "5 notifikácie" — so nothing fails
 * and nobody notices. These assertions exist so the count-bearing messages added for the arrival
 * snackbar and the collapsed clusters (N7) cannot quietly lose a form.
 */
const t = (key: string, count: number, named: Record<string, unknown> = {}) =>
	i18n.global.t(key, { ...named, count }, { locale: 'SK' })

describe('Slovak plural forms on the count-bearing notification messages', () => {
	it('picks all three forms for the burst snackbar', () => {
		expect(t('notifications.snackbar.burst', 1)).toBe('1 nová notifikácia')
		expect(t('notifications.snackbar.burst', 3)).toBe('3 nové notifikácie')
		expect(t('notifications.snackbar.burst', 5)).toBe('5 nových notifikácií')
	})

	it('picks all three forms for a named lead plus its remainder', () => {
		const named = { title: 'Úloha zlyhala' }

		expect(t('notifications.snackbar.leadAndMore', 1, named)).toBe('Úloha zlyhala · a 1 ďalšia')
		expect(t('notifications.snackbar.leadAndMore', 3, named)).toBe('Úloha zlyhala · a 3 ďalšie')
		expect(t('notifications.snackbar.leadAndMore', 5, named)).toBe('Úloha zlyhala · a 5 ďalších')
	})

	it('picks all three forms for a collapsed cluster', () => {
		expect(t('notifications.clusterMore', 1)).toBe('a 1 ďalšia')
		expect(t('notifications.clusterMore', 4)).toBe('a 4 ďalšie')
		expect(t('notifications.clusterMore', 9)).toBe('a 9 ďalších')
	})
})

describe('Slovak plural forms on the Google Calendar sync snackbar', () => {
	it('picks all three forms for synced tasks, and 0 reads as many', () => {
		expect(t('googleCalendar.syncSuccess', 1)).toBe('1 úloha synchronizovaná do Google Kalendára')
		expect(t('googleCalendar.syncSuccess', 3)).toBe('3 úlohy synchronizované do Google Kalendára')
		expect(t('googleCalendar.syncSuccess', 5)).toBe('5 úloh synchronizovaných do Google Kalendára')
		expect(t('googleCalendar.syncSuccess', 0)).toBe('0 úloh synchronizovaných do Google Kalendára')
	})

	it('picks all three forms for removed events', () => {
		expect(t('googleCalendar.syncRemoved', 1)).toBe('1 udalosť odstránená')
		expect(t('googleCalendar.syncRemoved', 2)).toBe('2 udalosti odstránené')
		expect(t('googleCalendar.syncRemoved', 7)).toBe('7 udalostí odstránených')
	})
})

describe('Slovak plural forms on the pomodoro outcome line', () => {
	// Pluralised on `{total}` by an explicit plural index, not on `named.count` — the way
	// PomodoroSaveBody calls it — so this also pins that the custom rule applies on that path.
	const outcome = (key: string, done: number, total: number) =>
		i18n.global.t(`history.pomodoro.outcome.${key}`, { done, total }, { locale: 'SK', plural: total })

	it('picks all three forms by the planned total', () => {
		expect(outcome('stoppedEarly', 0, 1)).toBe('Zastavené po 0 z 1 periódy sústredenia')
		expect(outcome('stoppedEarly', 2, 4)).toBe('Zastavené po 2 z 4 periód sústredenia')
		expect(outcome('stoppedEarly', 2, 8)).toBe('Zastavené po 2 z 8 periód sústredenia')
		expect(outcome('completed', 1, 1)).toBe('Prebehol celý plán: 1 perióda sústredenia')
		expect(outcome('completed', 3, 3)).toBe('Prebehol celý plán: 3 periódy sústredenia')
		expect(outcome('completed', 8, 8)).toBe('Prebehol celý plán: 8 periód sústredenia')
	})
})
