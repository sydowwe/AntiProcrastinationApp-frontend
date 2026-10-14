<template>
	<div>
		<div class="text-medium-emphasis mb-2 text-body-2">{{ i18n.t('user.sleepWindow.title') }}</div>
		<div class="d-flex flex-wrap ga-4">
			<TimePicker
				v-model="wakeUpDraft"
				:label="i18n.t('user.sleepWindow.wakeUp')"
				icon="far fa-sun"
				allowedMinutesSelected="5"
				width="140px"
				hideDetails
			/>
			<TimePicker
				v-model="bedTimeDraft"
				:label="i18n.t('user.sleepWindow.bedTime')"
				icon="fas fa-bed"
				allowedMinutesSelected="5"
				width="140px"
				hideDetails
			/>
		</div>
		<div class="text-medium-emphasis mt-2 text-caption">{{ i18n.t('user.sleepWindow.hint') }}</div>
		<div
			v-if="quietHoursFollow"
			class="text-medium-emphasis mt-1 text-caption"
		>
			<VIcon
				icon="moon"
				size="14"
				class="me-1"
			/>
			{{ i18n.t('user.sleepWindow.quietHoursFollow') }}
		</div>
	</div>
</template>
<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { watchDebounced } from '@vueuse/core'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import { fetchQuietHours } from '@/_common/modules/notifications/api/QuietHoursApi.ts'

	// FO10: when the user's day usually starts and ends. Every calendar day the server creates starts
	// with this window, and a change moves every day from today on that the user has not given a window
	// of its own (the day planner's day dialog, or an applied template). Past days stay as they were.

	// Long enough that picking the hour and then the minute in the clock is one save, not two — each save
	// rewrites the user's future days on the server.
	const SAVE_DEBOUNCE_MS = 800

	const i18n = useI18n()
	const userStore = useUserStore()
	const { defaultWakeUpTime, defaultBedTime } = useUserPreferences()
	const { showSuccessSnackbar } = useSnackbar()

	// Drafts rather than bindings to the store, so a half-picked time is not saved; resynced when the
	// stored value changes, because hydration can land after the first paint.
	const wakeUpDraft = ref(defaultWakeUpTime.value)
	const bedTimeDraft = ref(defaultBedTime.value)
	watch(defaultWakeUpTime, stored => (wakeUpDraft.value = stored))
	watch(defaultBedTime, stored => (bedTimeDraft.value = stored))

	watchDebounced(wakeUpDraft, next => save('defaultWakeUpTime', next, defaultWakeUpTime.value), {
		debounce: SAVE_DEBOUNCE_MS,
	})
	watchDebounced(bedTimeDraft, next => save('defaultBedTime', next, defaultBedTime.value), {
		debounce: SAVE_DEBOUNCE_MS,
	})

	// P3-01: when quiet hours follow the sleep schedule, these times decide when notifications go quiet
	// too, and nothing else on this screen would say so. Silent and best-effort: a failed read only
	// costs the line.
	const quietHoursFollow = ref(false)
	fetchQuietHours(true)
		.then(state => (quietHoursFollow.value = state.quietHours?.followsSleepSchedule === true))
		.catch(() => {})

	// One field per PUT: the server leaves an unsent field unchanged, on the user and on their days.
	async function save(field: 'defaultWakeUpTime' | 'defaultBedTime', next: Time, stored: Time) {
		if (next.getInMinutes === stored.getInMinutes) return
		try {
			await userStore.setPreferences({ [field]: new Time(next.hours, next.minutes) })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch {
			// Failures already surface as a snackbar from the axios interceptor. Put the stored value back,
			// so the picker does not show a time the server never accepted.
			if (field === 'defaultWakeUpTime') wakeUpDraft.value = defaultWakeUpTime.value
			else bedTimeDraft.value = defaultBedTime.value
		}
	}
</script>
