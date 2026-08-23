import { type ComponentPublicInstance, onBeforeUnmount, ref } from 'vue'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

type Section = 'pinned' | 'active' | 'inactive'

// Device-local ON PURPOSE — this is how the cards are arranged on this screen, and a phone's order
// is not a laptop's. It is user-scoped so two accounts on one browser do not shuffle each other's
// cards; it is not a candidate for the server. Reordering happens against server-owned templates,
// so a stale id in here is simply skipped by `applyOrder`.
const TEMPLATE_ORDER_KEY = 'templateSectionOrder'
type SectionOrder = { pinned: number[]; active: number[]; inactive: number[] }

function loadOrder(): SectionOrder {
	try {
		const stored = JSON.parse(readUserScoped(TEMPLATE_ORDER_KEY) || '{}')
		return {
			pinned: stored.pinned ?? [],
			active: stored.active ?? [],
			inactive: stored.inactive ?? [],
		}
	} catch {
		return { pinned: [], active: [], inactive: [] }
	}
}

export function useTemplateCardDragAndDrop() {
	const sectionOrder = ref<SectionOrder>(loadOrder())
	const cleanupMap = new Map<number, (() => void)[]>()
	const dragOverState = ref<{ templateId: number; position: 'before' | 'after' } | null>(null)

	function saveOrder() {
		writeUserScoped(TEMPLATE_ORDER_KEY, JSON.stringify(sectionOrder.value))
	}

	function applyOrder<T extends { id: number }>(list: T[], section: Section): T[] {
		const order = sectionOrder.value[section]
		if (!order.length) return list
		const byId = new Map(list.map(t => [t.id, t]))
		const ordered = order.map(id => byId.get(id)).filter(item => item !== undefined) as T[]
		const unordered = list.filter(t => !order.includes(t.id))
		return [...ordered, ...unordered]
	}

	function reorder(
		section: Section,
		sourceId: number,
		targetId: number,
		position: 'before' | 'after',
		currentIds: number[],
	) {
		const order = [...currentIds]
		const sourceIndex = order.indexOf(sourceId)
		if (sourceIndex === -1) return

		order.splice(sourceIndex, 1)
		const insertAt = order.indexOf(targetId) + (position === 'after' ? 1 : 0)
		order.splice(insertAt, 0, sourceId)

		sectionOrder.value[section] = order
		saveOrder()
	}

	// Takes what Vue's `VNodeRef` actually hands a function ref — `Element | ComponentPublicInstance |
	// null` — and narrows here, so call sites can pass the ref through untouched.
	function registerCard(
		el: Element | ComponentPublicInstance | null,
		templateId: number,
		section: Section,
		getIds: () => number[],
	) {
		const prev = cleanupMap.get(templateId)
		if (prev) {
			prev.forEach(c => c())
			cleanupMap.delete(templateId)
		}
		if (!(el instanceof HTMLElement)) return

		const c1 = draggable({
			element: el,
			getInitialData: () => ({ type: 'template-card', templateId, section }),
		})

		const c2 = dropTargetForElements({
			element: el,
			canDrop: ({ source }) =>
				source.data.type === 'template-card' &&
				source.data.section === section &&
				source.data.templateId !== templateId,
			getData: ({ input }) => {
				const rect = el.getBoundingClientRect()
				const position: 'before' | 'after' = input.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
				return { type: 'template-drop', templateId, position, section }
			},
			onDragEnter: ({ self }) => {
				dragOverState.value = {
					templateId: self.data.templateId as number,
					position: self.data.position as 'before' | 'after',
				}
			},
			onDrag: ({ self }) => {
				dragOverState.value = {
					templateId: self.data.templateId as number,
					position: self.data.position as 'before' | 'after',
				}
			},
			onDragLeave: () => {
				dragOverState.value = null
			},
			onDrop: ({ source, self }) => {
				reorder(
					section,
					source.data.templateId as number,
					self.data.templateId as number,
					self.data.position as 'before' | 'after',
					getIds(),
				)
				dragOverState.value = null
			},
		})

		cleanupMap.set(templateId, [c1, c2])
	}

	onBeforeUnmount(() => {
		cleanupMap.forEach(fns => fns.forEach(c => c()))
		cleanupMap.clear()
	})

	return { sectionOrder, applyOrder, registerCard, dragOverState }
}
