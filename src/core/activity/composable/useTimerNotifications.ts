import { ref, onUnmounted, getCurrentInstance } from 'vue'

const titleIntervalId = ref<number | undefined>(undefined)
const soundIntervalId = ref<number | undefined>(undefined)

let audioContext: AudioContext | null = null
let originalTitle: string | null = null
let listenerCount = 0

async function playNotificationSound() {
	try {
		if (!audioContext) {
			audioContext = new AudioContext()
		}
		if (audioContext.state === 'suspended') {
			await audioContext.resume()
		}

		const playTone = (frequency: number, startTime: number, duration: number) => {
			const oscillator = audioContext!.createOscillator()
			const gainNode = audioContext!.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(audioContext!.destination)

			oscillator.frequency.value = frequency
			oscillator.type = 'sine'

			gainNode.gain.setValueAtTime(0.3, startTime)
			gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

			oscillator.start(startTime)
			oscillator.stop(startTime + duration)
		}

		const now = audioContext.currentTime
		playTone(830, now, 0.15)
		playTone(1050, now + 0.15, 0.15)
		playTone(830, now + 0.3, 0.15)
		playTone(1050, now + 0.45, 0.3)
	} catch (e) {
		console.warn('Could not play notification sound:', e)
	}
}

function startSoundLoop() {
	void playNotificationSound()
	soundIntervalId.value = setInterval(() => void playNotificationSound(), 4000)
}

function stopSoundLoop() {
	if (soundIntervalId.value) {
		clearInterval(soundIntervalId.value)
		soundIntervalId.value = undefined
	}
}

function startTitleAnimation(message: string, alternateMessage?: string) {
	if (originalTitle === null) {
		originalTitle = document.title
	}
	const messages = alternateMessage ? [`⏰ ${message}`, `✅ ${alternateMessage}`] : [`⏰ ${message}`]
	let index = 0

	document.title = messages[0]!
	if (messages.length > 1) {
		titleIntervalId.value = setInterval(() => {
			index = (index + 1) % messages.length
			document.title = messages[index]!
		}, 1000)
	}
}

function stopTitleAnimation() {
	if (titleIntervalId.value) {
		clearInterval(titleIntervalId.value)
		titleIntervalId.value = undefined
	}
	if (originalTitle !== null) {
		document.title = originalTitle
		originalTitle = null
	}
}

function handleVisibilityChange() {
	if (document.visibilityState === 'visible') {
		stopTitleAnimation()
		stopSoundLoop()
	}
}

export function useTimerNotifications() {
	if (listenerCount === 0) {
		document.addEventListener('visibilitychange', handleVisibilityChange)
	}
	listenerCount++

	function triggerTimerEndNotification(title: string, activityName?: string) {
		startSoundLoop()
		startTitleAnimation(title, activityName)
	}

	function stopAllNotifications() {
		stopTitleAnimation()
		stopSoundLoop()
	}

	function removeListener() {
		listenerCount--
		if (listenerCount === 0) {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}

	function cleanup() {
		stopAllNotifications()
		removeListener()
	}

	// Unmounting this consumer must not silence another live consumer's alarm — only drop
	// this consumer's share of the listener refcount, not the shared sound/title state.
	if (getCurrentInstance()) {
		onUnmounted(removeListener)
	}

	return {
		playNotificationSound,
		startSoundLoop,
		stopSoundLoop,
		startTitleAnimation,
		stopTitleAnimation,
		triggerTimerEndNotification,
		stopAllNotifications,
		cleanup,
	}
}
