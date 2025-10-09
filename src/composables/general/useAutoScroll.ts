import {ref, onUnmounted, type Ref, type ComputedRef} from 'vue'

const SCROLL_THRESHOLD = 30
const MAX_SCROLL_SPEED = 15

export function useAutoScroll(scrollContainerRef: Ref<HTMLElement | undefined> | ComputedRef<HTMLElement | undefined>) {
	// Auto-scroll state
	const autoScrollInterval = ref<ReturnType<typeof setInterval> | null>(null)
	const autoScrollSpeed = ref<number>(0)

	// Auto-scroll functionality
	function handleAutoScroll(clientY: number): void {
		if (!scrollContainerRef.value) return

		const rect = scrollContainerRef.value.getBoundingClientRect()
		const distanceFromTop = clientY - rect.top
		const distanceFromBottom = rect.bottom - clientY

		if (autoScrollInterval.value) {
			clearInterval(autoScrollInterval.value)
			autoScrollInterval.value = null
		}

		if (distanceFromTop < SCROLL_THRESHOLD && distanceFromTop > 0) {
			const intensity = 1 - (distanceFromTop / SCROLL_THRESHOLD)
			autoScrollSpeed.value = -intensity * MAX_SCROLL_SPEED

			autoScrollInterval.value = setInterval(() => {
				if (scrollContainerRef.value) {
					scrollContainerRef.value.scrollTop += autoScrollSpeed.value
				}
			}, 16)
		} else if (distanceFromBottom < SCROLL_THRESHOLD && distanceFromBottom > 0) {
			const intensity = 1 - (distanceFromBottom / SCROLL_THRESHOLD)
			autoScrollSpeed.value = intensity * MAX_SCROLL_SPEED

			autoScrollInterval.value = setInterval(() => {
				if (scrollContainerRef.value) {
					scrollContainerRef.value.scrollTop += autoScrollSpeed.value
				}
			}, 16)
		}
	}

	function stopAutoScroll(): void {
		if (autoScrollInterval.value) {
			clearInterval(autoScrollInterval.value)
			autoScrollInterval.value = null
		}
		autoScrollSpeed.value = 0
	}

	// Cleanup on unmount
	onUnmounted(() => {
		stopAutoScroll()
	})

	return {
		handleAutoScroll,
		stopAutoScroll,
	}
}