// composables/useCurrentTime.ts
import { ref, onMounted, onUnmounted } from 'vue'

// Global current time - single timer for entire app
const currentTime = ref(new Date())
const currentTimeInterval = ref<ReturnType<typeof setInterval> | null>(null)
let instanceCount = 0

export function useCurrentTime() {
	onMounted(() => {
		instanceCount++
		if (instanceCount === 1 && !currentTimeInterval.value) {
			const updateCurrentTime = () => {
				currentTime.value = new Date()
			}
			updateCurrentTime()
			currentTimeInterval.value = setInterval(updateCurrentTime, 60000)
		}
	})

	onUnmounted(() => {
		instanceCount--
		if (instanceCount === 0 && currentTimeInterval.value) {
			clearInterval(currentTimeInterval.value)
			currentTimeInterval.value = null
		}
	})

	return {
		currentTime
	}
}