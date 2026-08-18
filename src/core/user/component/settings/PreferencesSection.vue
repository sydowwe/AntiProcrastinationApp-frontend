<template>
	<SettingsSection :title="i18n.t('user.preferences')">
		<VSwitch
			:modelValue="askBeforeDelete"
			:label="i18n.t('user.askBeforeDelete')"
			color="primary"
			hideDetails
			density="compact"
			@update:modelValue="onAskBeforeDeleteChange"
		/>
		<div class="mt-3">
			<div class="text-medium-emphasis mb-1 text-body-2">{{ i18n.t('user.firstDayOfWeek') }}</div>
			<VBtnToggle
				:modelValue="firstDayOfWeek"
				mandatory
				variant="tonal"
				color="secondaryOutline"
				density="compact"
				@update:modelValue="onFirstDayOfWeekChange"
			>
				<VBtn
					v-for="option in firstDayOfWeekOptions"
					:key="option.value"
					:value="option.value"
				>
					{{ option.label }}
				</VBtn>
			</VBtnToggle>
		</div>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import { useDayOfWeekOptions } from '@/_common/composable/general/useDayOfWeekOptions.ts'
	import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const userStore = useUserStore()
	// Through the composable, so the switch shows the same value the delete paths act on — an
	// unhydrated `undefined` would otherwise render "off" while the app is really asking.
	const { askBeforeDelete, firstDayOfWeek } = useUserPreferences()
	const { showSuccessSnackbar } = useSnackbar()

	// Reuses the framework's localized day labels rather than adding new locale keys — the type
	// stays `0 | 1`, only Monday and Sunday are rendered.
	const dayOfWeekOptions = useDayOfWeekOptions()
	const firstDayOfWeekOptions = computed(() =>
		dayOfWeekOptions.value
			.filter(option => option.value === DayOfWeek.Monday || option.value === DayOfWeek.Sunday)
			.map(option => ({
				value: option.value === DayOfWeek.Monday ? 1 : 0,
				label: option.label,
			})),
	)

	async function onAskBeforeDeleteChange(v: boolean) {
		try {
			await userStore.setPreferences({ askBeforeDelete: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch {
			// Failures already surface as a snackbar from the axios interceptor.
		}
	}

	async function onFirstDayOfWeekChange(v: 0 | 1) {
		try {
			await userStore.setPreferences({ firstDayOfWeek: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch {
			// Failures already surface as a snackbar from the axios interceptor.
		}
	}
</script>
