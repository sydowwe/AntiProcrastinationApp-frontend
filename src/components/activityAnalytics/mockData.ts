import {ActivityWindow} from '@/dtos/response/activityTracking/ActivityWindow'
import {WindowActivity} from '@/dtos/response/activityTracking/WindowActivity'

export function generateMockActivityWindows(): ActivityWindow[] {
	const now = new Date()
	const windows: ActivityWindow[] = []

	// Create 8 time windows, each 30 minutes apart
	for (let i = 7; i >= 0; i--) {
		const windowEnd = new Date(now.getTime() - i * 30 * 60 * 1000)
		const windowStart = new Date(windowEnd.getTime() - 30 * 60 * 1000)

		// Create varied activity patterns
		const activities = generateActivitiesForWindow(i)

		windows.push(new ActivityWindow(windowStart, windowEnd, activities))
	}

	return windows
}

function generateActivitiesForWindow(windowIndex: number): WindowActivity[] {
	// Pattern: some windows are productive, some are distracting, some are empty
	const patterns = [
		// Window 0 - Heavy development
		[
			new WindowActivity('github.com', 720, 180, 900, 'https://github.com/user/repo'),
			new WindowActivity('stackoverflow.com', 240, 60, 300, 'https://stackoverflow.com/questions/123'),
			new WindowActivity('localhost', 420, 120, 540, 'http://localhost:3000'),
			new WindowActivity('docs.vuejs.org', 180, 60, 240, 'https://docs.vuejs.org/guide'),
		],
		// Window 1 - Mixed productivity
		[
			new WindowActivity('github.com', 480, 120, 600, 'https://github.com/user/repo/pull/42'),
			new WindowActivity('youtube.com', 300, 180, 480, 'https://youtube.com/watch?v=tutorial'),
			new WindowActivity('discord.com', 120, 60, 180, 'https://discord.com/channels/123'),
		],
		// Window 2 - Empty (break time)
		[],
		// Window 3 - Light activity
		[
			new WindowActivity('gmail.com', 240, 120, 360, 'https://mail.google.com'),
			new WindowActivity('slack.com', 180, 90, 270, 'https://app.slack.com'),
		],
		// Window 4 - Research heavy
		[
			new WindowActivity('stackoverflow.com', 540, 120, 660, 'https://stackoverflow.com'),
			new WindowActivity('developer.mozilla.org', 360, 90, 450, 'https://developer.mozilla.org'),
			new WindowActivity('github.com', 300, 150, 450, 'https://github.com'),
			new WindowActivity('medium.com', 180, 60, 240, 'https://medium.com/article'),
			new WindowActivity('reddit.com', 120, 60, 180, 'https://reddit.com/r/programming'),
		],
		// Window 5 - Distraction heavy
		[
			new WindowActivity('youtube.com', 600, 300, 900, 'https://youtube.com/watch?v=cat-video'),
			new WindowActivity('reddit.com', 420, 180, 600, 'https://reddit.com/r/funny'),
			new WindowActivity('twitter.com', 240, 120, 360, 'https://twitter.com'),
		],
		// Window 6 - Focused development
		[
			new WindowActivity('localhost', 900, 240, 1140, 'http://localhost:8080'),
			new WindowActivity('github.com', 360, 120, 480, 'https://github.com'),
			new WindowActivity('vuetifyjs.com', 180, 60, 240, 'https://vuetifyjs.com/components'),
		],
		// Window 7 - Current window (light activity)
		[
			new WindowActivity('github.com', 180, 60, 240, 'https://github.com/user/repo'),
			new WindowActivity('localhost', 120, 30, 150, 'http://localhost:3000'),
		],
	]

	return patterns[windowIndex] || []
}

// Alternative: Generate random mock data
export function generateRandomActivityWindows(count: number = 10): ActivityWindow[] {
	const now = new Date()
	const windows: ActivityWindow[] = []
	const domains = [
		'github.com',
		'stackoverflow.com',
		'youtube.com',
		'discord.com',
		'gmail.com',
		'slack.com',
		'localhost',
		'docs.vuejs.org',
		'vuetifyjs.com',
		'reddit.com',
		'twitter.com',
		'medium.com',
		'developer.mozilla.org',
	]

	for (let i = count - 1; i >= 0; i--) {
		const windowEnd = new Date(now.getTime() - i * 30 * 60 * 1000)
		const windowStart = new Date(windowEnd.getTime() - 30 * 60 * 1000)

		// Random number of activities (0-6)
		const activityCount = Math.floor(Math.random() * 7)
		const activities: WindowActivity[] = []

		// Shuffle domains and pick random ones
		const shuffled = [...domains].sort(() => Math.random() - 0.5)

		for (let j = 0; j < activityCount; j++) {
			const domain = shuffled[j]
			const activeSeconds = Math.floor(Math.random() * 900) // 0-15 minutes
			const backgroundSeconds = Math.floor(Math.random() * 300) // 0-5 minutes
			const totalSeconds = activeSeconds + backgroundSeconds

			activities.push(
				new WindowActivity(
					domain ?? '',
					activeSeconds,
					backgroundSeconds,
					totalSeconds,
					`https://${domain}/example`
				)
			)
		}

		windows.push(new ActivityWindow(windowStart, windowEnd, activities))
	}

	return windows
}
