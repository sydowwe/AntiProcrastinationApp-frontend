import { describe, expect, it } from 'vitest'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'

/**
 * Two wire shapes arrive under the key `activity`, by route (backend `fa47560`, closing
 * `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md`):
 *
 * - the four profile grids send a full `ActivityResponse` — nested `role` and a **nullable** `category`,
 *   and no flat `icon`/`color`/`categoryName` at all;
 * - `/leisure/suggestion/draw` still sends the flat `ActivityInfoResponse`, with the fallback already
 *   applied server-side.
 *
 * Parsing only the flat shape is what made `ActivityNameCell`'s `v-if="activity.icon"` never fire: the
 * name resolved, the icon silently did not. The bodies below were captured from the running API on
 * 2026-09-13 against fixture `e2e-v2`.
 */
describe('ActivityInfo parses both activity shapes', () => {
	const gridActivity = {
		id: 12009,
		name: 'Build a Bookshelf',
		text: 'Build a Bookshelf',
		isArchived: false,
		isOnTodoList: false,
		usageCount: 0,
		canDelete: false,
		role: { id: 1, name: 'Hobbies & Leisure', text: '…', color: 'violet', icon: 'fas fa-guitar' },
		category: null,
	}

	it('falls back to the role when the grid row has no category', () => {
		const info = ActivityInfo.fromJson(gridActivity)

		expect(info.name).toBe('Build a Bookshelf')
		expect(info.icon).toBe('fas fa-guitar')
		expect(info.color).toBe('violet')
		expect(info.categoryName).toBeNull()
	})

	it('prefers the category over the role, because the category is the more specific one', () => {
		const info = ActivityInfo.fromJson({
			...gridActivity,
			category: { id: 7, name: 'Woodworking', color: 'brown', icon: 'fas fa-hammer' },
		})

		expect(info.icon).toBe('fas fa-hammer')
		expect(info.color).toBe('brown')
		expect(info.categoryName).toBe('Woodworking')
	})

	it('still reads the flat draw shape, which is the one route that kept it', () => {
		const info = ActivityInfo.fromJson({
			id: 12009,
			name: 'Build a Bookshelf',
			categoryName: 'Woodworking',
			icon: 'fas fa-hammer',
			color: 'brown',
		})

		expect(info.categoryName).toBe('Woodworking')
		expect(info.icon).toBe('fas fa-hammer')
		expect(info.color).toBe('brown')
	})

	it('reads an archived activity, which memory-anchor rows deliberately still carry', () => {
		const info = ActivityInfo.fromJson({ ...gridActivity, id: 12010, name: 'Retired Hobby', isArchived: true })

		expect(info.name).toBe('Retired Hobby')
		expect(info.icon).toBe('fas fa-guitar')
	})

	it('yields empty defaults rather than throwing on an absent activity', () => {
		const info = ActivityInfo.fromJson({})

		expect(info.id).toBe(0)
		expect(info.name).toBe('')
		expect(info.icon).toBeNull()
		expect(info.color).toBeNull()
		expect(info.categoryName).toBeNull()
	})
})
