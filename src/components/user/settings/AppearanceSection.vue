<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3>{{ i18n.t('user.appearance') }}</h3>
		<div class="mb-3">
			<div class="text-medium-emphasis mb-1 text-body-2">{{ i18n.t('theme.label') }}</div>
			<VBtnToggle
				:modelValue="currentUser.theme"
				mandatory
				variant="tonal"
				color="secondaryOutline"
				density="compact"
				@update:modelValue="onThemeChange"
			>
				<VBtn value="light">{{ i18n.t('theme.light') }}</VBtn>
				<VBtn value="dark">{{ i18n.t('theme.dark') }}</VBtn>
				<VBtn value="system">{{ i18n.t('theme.system') }}</VBtn>
			</VBtnToggle>
		</div>
		<VIdSelect
			:modelValue="currentUser.locale"
			:items="localeOptions"
			:label="i18n.t('user.language')"
			@update:modelValue="onLocaleChange"
		/>
		<VAutocomplete
			:modelValue="currentUser.timezone"
			:items="timezones"
			:label="i18n.t('user.timezone')"
			@update:modelValue="onTimezoneChange"
		/>

		<h3>{{ i18n.t('user.accountInfo') }}</h3>
		<div class="d-flex justify-space-between align-center">
			<span class="text-medium-emphasis">{{ i18n.t('user.memberSince') }}</span>
			<span>{{ memberSince }}</span>
		</div>
		<div
			v-if="currentUser.lastLoginAt"
			class="d-flex justify-space-between align-center"
		>
			<span class="text-medium-emphasis">{{ i18n.t('user.lastLogin') }}</span>
			<span>{{ lastLogin }}</span>
		</div>
	</VCard>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/userStore.ts'
	import { AvailableLocales } from '@/dtos/enum/AvailableLocales.ts'
	import type { ThemePreference } from '@/dtos/response/user/User.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { handleHttpCodes } from '@/composables/general/ErrorHandlingFunctions.ts'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'

	const i18n = useI18n()
	const userStore = useUserStore()
	const { showSuccessSnackbar } = useSnackbar()

	const currentUser = computed(() => userStore.currentUser)

	const localeOptions = Object.values(AvailableLocales).map(l => ({ id: l, text: i18n.t(`locales.${l}`) }))
	const timezones = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : []

	async function onThemeChange(v: ThemePreference) {
		try {
			await userStore.setPreferences({ theme: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		}
	}

	async function onLocaleChange(v: AvailableLocales) {
		try {
			await userStore.setPreferences({ locale: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		}
	}

	async function onTimezoneChange(v: string) {
		try {
			await userStore.setPreferences({ timezone: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		}
	}

	async function onFirstDayChange(v: 0 | 1) {
		try {
			await userStore.setPreferences({ firstDayOfWeek: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		}
	}

	dayjs.extend(relativeTime)

	const memberSince = computed(() =>
		currentUser.value.createdAt ? dayjs(currentUser.value.createdAt).format('D. M. YYYY') : '—',
	)

	const lastLogin = computed(() =>
		currentUser.value.lastLoginAt ? dayjs(currentUser.value.lastLoginAt).fromNow() : '—',
	)
</script>
