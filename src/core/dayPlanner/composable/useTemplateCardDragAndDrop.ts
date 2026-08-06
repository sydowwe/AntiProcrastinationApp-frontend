import { onBeforeUnmount, ref } from 'vue'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

type Section = 'pinned' | 'active' | 'inactive'

const TEMPLATE_ORDER_KEY = 'templateSectionOrder'
type SectionOrder = { pinned: number[]; active: number[]; inactive: number[] }

function loadOrder(): SectionOrder {
	try {
		const stored = JSON.parse(localStorage.getItem(TEMPLATE_ORDER_KEY) || '{}')
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
		localStorage.setItem(TEMPLATE_ORDER_KEY, JSON.stringify(sectionOrder.value))
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

	function registerCard(el: HTMLElement | null, templateId: number, section: Section, getIds: () => number[]) {
		const prev = cleanupMap.get(templateId)
		if (prev) {
			prev.forEach(c => c())
			cleanupMap.delete(templateId)
		}
		if (!el) return

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
