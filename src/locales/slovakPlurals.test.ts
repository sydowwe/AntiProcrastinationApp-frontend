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
