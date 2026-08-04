<template>
	<VCard
		elevation="2"
		color="secondary"
	>
		<VCardItem>
			<template #prepend>
				<VIcon
					icon="moon"
					color="primary"
				/>
			</template>
			<VCardTitle>{{ i18n.t('reminderPreference.quietHours.title') }}</VCardTitle>
			<VCardSubtitle class="text-wrap">{{ i18n.t('reminderPreference.quietHours.subtitle') }}</VCardSubtitle>
		</VCardItem>
		<VCardText>
			<VSwitch
				v-model="enabled"
				color="primary"
				:label="i18n.t('reminderPreference.quietHours.enable')"
				density="comfortable"
				hideDetails
			/>
			<div
				v-auto-animate
				class="mt-2"
			>
				<div v-if="enabled">
					<div class="d-flex ga-3 align-center flex-wrap">
						<TimePicker
							v-model="startTime"
							icon="far fa-moon"
							:label="i18n.t('reminderPreference.quietHours.from')"
							allowedMinutesSelected="5"
							hideDetails
						/>
						<VIcon
							icon="arrow-right"
							size="16"
							class="d-none d-sm-inline"
						/>
						<TimePicker
							v-model="endTime"
							icon="far fa-sun"
							:label="i18n.t('reminderPreference.quietHours.to')"
							allowedMinutesSelected="5"
							hideDetails
						/>
					</div>
					<p
						v-if="isOvernight"
						class="text-caption text-medium-emphasis mt-2 mb-0"
					>
						<VIcon
							icon="circle-info"
							size="14"
							class="me-1"
						/>
						{{ i18n.t('reminderPreference.quietHours.overnightHint') }}
					</p>
					<p
						v-if="isZeroLength"
						class="text-caption text-error mt-2 mb-0"
					>
						<VIcon
							icon="triangle-exclamation"
							size="14"
							class="me-1"
						/>
						{{ i18n.t('reminderPreference.quietHours.zeroLengthError') }}
					</p>
				</div>
			</div>
		</VCardText>
		<VCardActions class="px-4 pb-4">
			<VBtn
				v-if="window !== null"
				variant="text"
				color="error"
				:loading="clearing"
				:disabled="saving"
				@click="clear"
			>
				{{ i18n.t('reminderPreference.quietHours.clear') }}
			</VBtn>
			<VSpacer />
			<VBtn
				color="primary"
				prependIcon="floppy-disk"
				:loading="saving"
				:disabled="clearing || isZeroLength"
				@click="save"
			>
				{{ i18n.t('controls.save') }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { QuietHoursWindow } from '@/core/notifications/reminderPreference/dto/response/QuietHoursWindow.ts'
	import {
		clearQuietHours,
		setQuietHours,
	} from '@/core/notifications/reminderPreference/api/ReminderPreferenceApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useErrorHandling } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import type { AxiosError } from 'axios'

	const { window = null } = defineProps<{ window?: QuietHoursWindow | null }>()

	const emit = defineEmits<{ updated: [window: QuietHoursWindow | null] }>()

	const i18n = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { handleHttpCodes } = useErrorHandling()

	// Sensible default for a brand-new window: an overnight 22:00 → 06:00.
	const enabled = ref(window !== null)
	const startTime = ref(Time.fromMinutes(window?.startMinute ?? 22 * 60))
	const endTime = ref(Time.fromMinutes(window?.endMinute ?? 6 * 60))
	const saving = ref(false)
	const clearing = ref(false)

	watch(
		() => window,
		newWindow => {
			enabled.value = newWindow !== null
			startTime.value = Time.fromMinutes(newWindow?.startMinute ?? 22 * 60)
			endTime.value = Time.fromMinutes(newWindow?.endMinute ?? 6 * 60)
		},
	)

	const isZeroLength = computed(() => enabled.value && startTime.value.getInMinutes === endTime.value.getInMinutes)
	const isOvernight = computed(() => startTime.value.getInMinutes > endTime.value.getInMinutes)

	async function save(): Promise<void> {
		if (!enabled.value) {
			await clear()
			return
		}
		if (isZeroLength.value) return
		saving.value = true
		try {
			const startMinute = startTime.value.getInMinutes
			const endMinute = endTime.value.getInMinutes
			await setQuietHours(startMinute, endMinute)
			emit('updated', new QuietHoursWindow(startMinute, endMinute))
			showSuccessSnackbar(i18n.t('reminderPreference.quietHours.saved'))
		} catch (e) {
			handleHttpCodes((e as AxiosError).response?.status ?? 0)
		} finally {
			saving.value = false
		}
	}

	async function clear(): Promise<void> {
		clearing.value = true
		try {
			await clearQuietHours()
			enabled.value = false
			emit('updated', null)
			showSuccessSnackbar(i18n.t('reminderPreference.quietHours.cleared'))
		} catch {
			showErrorSnackbar(i18n.t('reminderPreference.quietHours.clearError'))
		} finally {
			clearing.value = false
		}
	}
</script>
