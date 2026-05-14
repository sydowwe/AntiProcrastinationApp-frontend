import { onBeforeUnmount, onMounted, type Ref, watch } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'

interface UseTodoItemDraggableOptions {
	elementRef: Ref<any>
	previewRef: Ref<any>
	isInChangeOrderMode: () => boolean
	getData: () => { itemId: number; activityId: number; listId: number }
}

export function useTodoItemDraggable(options: UseTodoItemDraggableOptions) {
	const { elementRef, previewRef, isInChangeOrderMode, getData } = options

	let cleanup: (() => void) | null = null

	function setup() {
		if (!isInChangeOrderMode()) return

		const element = elementRef.value?.$el || elementRef.value
		if (!element) return

		cleanup = draggable({
			element,
			getInitialData: () => ({ type: 'todo-item', ...getData() }),
			onGenerateDragPreview: ({ nativeSetDragImage }) => {
				const previewElement = previewRef.value?.$el
				if (!previewElement) return

				setCustomNativeDragPreview({
					nativeSetDragImage,
					getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
					render: ({ container }) => {
						const cloned = previewElement.cloneNode(true) as HTMLElement
						cloned.style.display = 'block'
						container.appendChild(cloned)
						return () => container.removeChild(cloned)
					},
				})
			},
		})
	}

	onMounted(() => {
		setup()
	})

	onBeforeUnmount(() => {
		cleanup?.()
	})

	watch(isInChangeOrderMode, newValue => {
		cleanup?.()
		cleanup = null
		if (newValue) setup()
	})
}
