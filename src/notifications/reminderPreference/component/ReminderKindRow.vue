<template>
	<div class="d-flex align-center ga-3 py-2 flex-wrap">
		<div class="flex-grow-1 me-auto">
			<div class="d-flex align-center ga-2">
				<span class="font-weight-medium">{{ kindLabel }}</span>
				<VChip
					size="x-small"
					variant="tonal"
					color="primaryOutline"
				>
					{{ ownerLabel }}
				</VChip>
			</div>
			<span class="text-caption text-medium-emphasis">
				{{
					enabledLocal
						? i18n.t('reminderPreference.kind.deliveredHint')
						: i18n.t('reminderPreference.kind.mutedHint')
				}}
			</span>
		</div>
		<VSelect
			v-model="channelLocal"
			:items="channelOptions"
			itemTitle="title"
			itemValue="value"
			:label="i18n.t('reminderPreference.kind.channelHint')"
			:disabled="!enabledLocal || saving"
			density="compact"
			hideDetails
			style="max-width: 180px"
			@update:modelValue="persist"
		/>
		<VSwitch
			v-model="enabledLocal"
			color="primary"
			density="compact"
			hideDetails
			:loading="saving"
			@update:modelValue="persist"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ReminderKindPreference } from '@/core/notifications/reminderPreference/dto/response/ReminderKindPreference.ts'
	import { UpsertReminderKindRequest } from '@/core/notifications/reminderPreference/dto/request/UpsertReminderKindRequest.ts'
	import { ReminderChannel } from '@/core/notifications/reminderPreference/dto/enum/ReminderChannel.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { upsertReminderKind } from '@/core/notifications/reminderPreference/api/ReminderPreferenceApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useErrorHandling } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import type { AxiosError } from 'axios'

	const { preference } = defineProps<{ preference: ReminderKindPreference }>()

	const emit = defineEmits<{ updated: [preference: ReminderKindPreference] }>()

	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { handleHttpCodes } = useErrorHandling()

	const enabledLocal = ref(preference.enabled)
	const channelLocal = ref<ReminderChannel | null>(preference.channel)
	const saving = ref(false)

	watch(
		() => preference,
		newPreference => {
			enabledLocal.value = newPreference.enabled
			channelLocal.value = newPreference.channel
		},
	)

	const channelOptions = getEnumSelectOptions(ReminderChannel, 'reminderPreference.channel')

	// Owner module + kind come from the server as raw identifiers; show a localized label when one
	// exists, otherwise fall back to the raw value so newly added kinds are never blank.
	const ownerLabel = computed(() => {
		const key = `reminderPreference.ownerModule.${preference.ownerModule}`
		return i18n.te(key) ? i18n.t(key) : preference.ownerModule
	})
	const kindLabel = computed(() => {
		const key = `reminderPreference.kindName.${preference.kind}`
		return i18n.te(key) ? i18n.t(key) : preference.kind
	})

	async function persist(): Promise<void> {
		saving.value = true
		try {
			const request = new UpsertReminderKindRequest(
				preference.ownerModule,
				preference.kind,
				enabledLocal.value,
				channelLocal.value,
			)
			await upsertReminderKind(request)
			emit(
				'updated',
				new ReminderKindPreference(
					preference.ownerModule,
					preference.kind,
					enabledLocal.value,
					channelLocal.value,
				),
			)
			showSuccessSnackbar(i18n.t('reminderPreference.kind.saved'))
		} catch (e) {
			// Revert the optimistic toggle so the UI keeps matching the server.
			enabledLocal.value = preference.enabled
			channelLocal.value = preference.channel
			handleHttpCodes((e as AxiosError).response?.status ?? 0)
		} finally {
			saving.value = false
		}
	}
</script>
