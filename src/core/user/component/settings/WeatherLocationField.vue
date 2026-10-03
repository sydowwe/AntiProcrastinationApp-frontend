<template>
	<VTextField
		v-model="draft"
		:label="i18n.t('user.weatherLocation')"
		:hint="i18n.t('user.weatherLocationHint')"
		persistentHint
		:placeholder="i18n.t('user.weatherLocationPlaceholder')"
		prependInnerIcon="fas fa-location-dot"
		:counter="WEATHER_LOCATION_MAX_LENGTH"
		:maxlength="WEATHER_LOCATION_MAX_LENGTH"
		:loading="saving"
		autocomplete="address-level2"
		@update:focused="onFocusChange"
		@keydown.enter="save"
		@click:clear="save"
	/>
</template>
<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'

	// The server's limit (`UpdateUserPreferencesValidator`). Enforced by `maxlength` rather than a
	// rule, so an over-long value can never be typed, and so never reaches the 400.
	const WEATHER_LOCATION_MAX_LENGTH = 120

	const i18n = useI18n()
	const userStore = useUserStore()
	const { weatherLocation } = useUserPreferences()
	const { showSuccessSnackbar } = useSnackbar()

	// A draft rather than a binding to the store: saving on every keystroke would PUT each prefix of
	// the town's name, and the server geocodes whatever it holds on the next picker load.
	const draft = ref<string | null>(weatherLocation.value)
	// Hydration lands after the first paint, so the stored value can arrive after the draft was made.
	watch(weatherLocation, stored => (draft.value = stored))

	const saving = ref(false)
	// What the in-flight PUT is sending, so Enter followed by the blur it causes saves once, not twice.
	let pending: string | null = null

	function onFocusChange(focused: boolean) {
		if (!focused) void save()
	}

	// Free text, checked for length only — whether a place geocodes is answered by the provider on the
	// next picker load, not here, so a typo surfaces as no weather signal rather than a save error.
	async function save() {
		const next = draft.value?.trim() ?? ''
		if (next === (weatherLocation.value ?? '') || next === pending) return
		pending = next
		saving.value = true
		try {
			// `''` is the server's clear; `null` would mean "leave unchanged".
			await userStore.setPreferences({ weatherLocation: next })
			draft.value = next || null
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch {
			// Failures already surface as a snackbar from the axios interceptor. Put the stored value
			// back, so the field does not show a location the server never accepted.
			draft.value = weatherLocation.value
		} finally {
			pending = null
			saving.value = false
		}
	}
</script>
