<template>
	<div>
		<VSwitch
			:modelValue="morningBriefingEnabled"
			:label="i18n.t('user.morningBriefing.label')"
			:hint="i18n.t('user.morningBriefing.hint')"
			persistentHint
			color="primary"
			density="compact"
			@update:modelValue="onEnabledChange"
		/>
		<VSelect
			v-if="morningBriefingEnabled"
			:modelValue="morningBriefingOffsetMinutes"
			:items="offsetItems"
			:label="i18n.t('user.morningBriefing.offsetLabel')"
			class="mt-3"
			density="compact"
			maxWidth="260"
			hideDetails
			@update:modelValue="onOffsetChange"
		/>
	</div>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'

	// P2-01: one notification at the start of the day, sent at the day's wake-up (the "usual day" above
	// when the day has no window of its own) plus the offset picked here. With it on, the server stops
	// sending the separate "routine suggested for today" reminder; turning it off brings that one back.

	// The server accepts any whole minute from 0 to 180; these are the steps offered.
	const OFFSET_STEPS = [0, 15, 30, 60, 90, 120, 180]

	const i18n = useI18n()
	const userStore = useUserStore()
	// Through the composable, so an unhydrated user shows the server's defaults (on, at wake-up) rather
	// than an `undefined` that would render the switch off.
	const { morningBriefingEnabled, morningBriefingOffsetMinutes } = useUserPreferences()
	const { showSuccessSnackbar } = useSnackbar()

	// A stored offset that is not one of the steps (set by another client, or a future one) is still
	// listed, so the select shows it instead of an empty field.
	const offsetItems = computed(() => {
		const steps = OFFSET_STEPS.includes(morningBriefingOffsetMinutes.value)
			? OFFSET_STEPS
			: [...OFFSET_STEPS, morningBriefingOffsetMinutes.value].sort((a, b) => a - b)
		return steps.map(minutes => ({ value: minutes, title: offsetTitle(minutes) }))
	})

	function offsetTitle(minutes: number): string {
		return minutes === 0
			? i18n.t('user.morningBriefing.atWakeUp')
			: i18n.t('user.morningBriefing.afterWakeUp', { minutes })
	}

	// VSwitch types its update event as `boolean | null`; a null lands on `false`, as in `PreferencesSection`.
	async function onEnabledChange(v: boolean | null) {
		await save({ morningBriefingEnabled: v === true })
	}

	async function onOffsetChange(v: number) {
		if (v === morningBriefingOffsetMinutes.value) return
		await save({ morningBriefingOffsetMinutes: v })
	}

	async function save(partial: { morningBriefingEnabled?: boolean; morningBriefingOffsetMinutes?: number }) {
		try {
			await userStore.setPreferences(partial)
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch {
			// Failures already surface as a snackbar from the axios interceptor.
		}
	}
</script>
