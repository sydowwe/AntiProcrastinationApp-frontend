import {ref, onUnmounted} from 'vue';

const originalTitle = document.title;
const titleIntervalId = ref<number | undefined>(undefined);
const soundIntervalId = ref<number | undefined>(undefined);

let audioContext: AudioContext | null = null;

function playNotificationSound() {
	try {
		if (!audioContext) {
			audioContext = new AudioContext();
		}

		const playTone = (frequency: number, startTime: number, duration: number) => {
			const oscillator = audioContext!.createOscillator();
			const gainNode = audioContext!.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext!.destination);

			oscillator.frequency.value = frequency;
			oscillator.type = 'sine';

			gainNode.gain.setValueAtTime(0.3, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

			oscillator.start(startTime);
			oscillator.stop(startTime + duration);
		};

		const now = audioContext.currentTime;
		playTone(830, now, 0.15);
		playTone(1050, now + 0.15, 0.15);
		playTone(830, now + 0.3, 0.15);
		playTone(1050, now + 0.45, 0.3);
	} catch (e) {
		console.warn('Could not play notification sound:', e);
	}
}

function startSoundLoop() {
	playNotificationSound();
	soundIntervalId.value = setInterval(playNotificationSound, 4000);
}

function stopSoundLoop() {
	if (soundIntervalId.value) {
		clearInterval(soundIntervalId.value);
		soundIntervalId.value = undefined;
	}
}

function startTitleAnimation(message: string, alternateMessage?: string) {
	const messages = alternateMessage
		? [`⏰ ${message}`, `✅ ${alternateMessage}`]
		: [`⏰ ${message}`];
	let index = 0;

	document.title = messages[0]!;
	if (messages.length > 1) {
		titleIntervalId.value = setInterval(() => {
			index = (index + 1) % messages.length;
			document.title = messages[index]!;
		}, 1000);
	}
}

function stopTitleAnimation() {
	if (titleIntervalId.value) {
		clearInterval(titleIntervalId.value);
		titleIntervalId.value = undefined;
	}
	document.title = originalTitle;
}

function handleVisibilityChange() {
	if (document.visibilityState === 'visible') {
		stopTitleAnimation();
		stopSoundLoop();
	}
}

export function useTimerNotifications() {
	document.addEventListener('visibilitychange', handleVisibilityChange);

	function triggerTimerEndNotification(title: string, activityName?: string) {
		startSoundLoop();
		startTitleAnimation(title, activityName);
	}

	function stopAllNotifications() {
		stopTitleAnimation();
		stopSoundLoop();
	}

	function cleanup() {
		stopAllNotifications();
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	}

	onUnmounted(cleanup);

	return {
		playNotificationSound,
		startSoundLoop,
		stopSoundLoop,
		startTitleAnimation,
		stopTitleAnimation,
		triggerTimerEndNotification,
		stopAllNotifications,
		cleanup
	};
}