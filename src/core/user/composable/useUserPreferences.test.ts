import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

// A bare object standing in for the store's `currentUser`: a fresh `new User()` carries none of this
// app's fields (interface merging declares types, it cannot create values), which is the state the
// defaults exist for.
const store = reactive<{ currentUser: Record<string, unknown> }>({ currentUser: {} })

vi.mock('@/_common/modules/user/store/authStore.ts', () => ({
	useUserStore: () => store,
}))

const { useUserPreferences } = await import('@/core/user/composable/useUserPreferences.ts')

describe('the morning briefing preferences (P2-01)', () => {
	it('reads an unhydrated user as on, at wake-up — the server defaults', () => {
		store.currentUser = {}
		const { morningBriefingEnabled, morningBriefingOffsetMinutes } = useUserPreferences()

		expect(morningBriefingEnabled.value).toBe(true)
		expect(morningBriefingOffsetMinutes.value).toBe(0)
	})

	it('follows the server once hydration lands', () => {
		store.currentUser = {}
		const { morningBriefingEnabled, morningBriefingOffsetMinutes } = useUserPreferences()

		store.currentUser = { morningBriefingEnabled: false, morningBriefingOffsetMinutes: 30 }

		expect(morningBriefingEnabled.value).toBe(false)
		expect(morningBriefingOffsetMinutes.value).toBe(30)
	})
})
