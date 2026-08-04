<template>
	<VRow
		justify="center"
		class="mt-8 mb-12"
	>
		<VCol
			cols="12"
			sm="11"
			md="9"
			lg="7"
			class="d-flex flex-column ga-4"
		>
			<div class="text-center mb-2">
				<h2>{{ i18n.t('reminderPreference.title') }}</h2>
				<p class="text-body-2 text-medium-emphasis mb-0 mt-1">
					{{ i18n.t('reminderPreference.intro') }}
				</p>
			</div>

			<VProgressLinear
				v-if="loading"
				indeterminate
				color="primary"
				rounded
			/>

			<template v-else>
				<QuietHoursCard
					:window="preferences.quietHours"
					@updated="onQuietHoursUpdated"
				/>
				<ReminderKindList
					:preferences="preferences.kindPreferences"
					@updated="onKindUpdated"
				/>
			</template>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import QuietHoursCard from '@/core/notifications/reminderPreference/component/QuietHoursCard.vue'
	import ReminderKindList from '@/core/notifications/reminderPreference/component/ReminderKindList.vue'
	import { ReminderPreferenceResponse } from '@/core/notifications/reminderPreference/dto/response/ReminderPreferenceResponse.ts'
	import type { ReminderKindPreference } from '@/core/notifications/reminderPreference/dto/response/ReminderKindPreference.ts'
	import type { QuietHoursWindow } from '@/core/notifications/reminderPreference/dto/response/QuietHoursWindow.ts'
	import { fetchReminderPreferences } from '@/core/notifications/reminderPreference/api/ReminderPreferenceApi.ts'
	import { useErrorHandling } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import type { AxiosError } from 'axios'

	const i18n = useI18n()
	const { handleHttpCodes } = useErrorHandling()

	const preferences = ref(new ReminderPreferenceResponse([], null))
	const loading = ref(true)

	onMounted(loadPreferences)

	async function loadPreferences(): Promise<void> {
		loading.value = true
		try {
			preferences.value = await fetchReminderPreferences()
		} catch (e) {
			handleHttpCodes((e as AxiosError).response?.status ?? 0)
		} finally {
			loading.value = false
		}
	}

	function onQuietHoursUpdated(window: QuietHoursWindow | null): void {
		preferences.value.quietHours = window
	}

	function onKindUpdated(updated: ReminderKindPreference): void {
		const index = preferences.value.kindPreferences.findIndex(
			p => p.ownerModule === updated.ownerModule && p.kind === updated.kind,
		)
		if (index === -1) {
			preferences.value.kindPreferences.push(updated)
		} else {
			preferences.value.kindPreferences.splice(index, 1, updated)
		}
	}
</script>
