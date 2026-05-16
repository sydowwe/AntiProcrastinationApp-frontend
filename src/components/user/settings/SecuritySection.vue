<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3>{{ i18n.t('user.security') }}</h3>
		<VCard
			variant="outlined"
			color="secondaryOutline"
			class="pa-3"
		>
			<div class="d-flex justify-space-between align-center">
				<span style="font-size: 1.07rem">
					<span>{{ i18n.t('authorization.email') }}:</span>
					<strong class="px-2">{{ userStore.currentUser.email }}</strong>
				</span>
				<VBtn
					color="primary"
					@click="changeEmailDialog?.open()"
				>
					{{ i18n.t('controls.edit') }}
				</VBtn>
			</div>
		</VCard>
		<VSwitch
			v-model="isTwoFactorAuthEnabled"
			color="primary"
			:label="i18n.t('user.use2FA')"
			hideDetails
			density="compact"
			@click="toggleTwoFactorAuth"
		/>
		<VSwitch
			v-if="pushSupported"
			v-model="pushEnabled"
			color="primary"
			:label="i18n.t('user.pushNotifications')"
			hideDetails
			density="compact"
			@click="togglePushNotifications"
		/>
		<VCard
			variant="outlined"
			color="secondaryOutline"
			class="pa-3"
		>
			<div class="d-flex justify-space-between align-center">
				<div class="d-flex align-center ga-2">
					<VIcon icon="fab fa-google" />
					<span>{{ i18n.t('googleCalendar.title') }}</span>
					<VChip
						:color="googleCalendarConnected ? 'success' : 'error'"
						size="small"
						density="compact"
					>
						{{
							i18n.t(googleCalendarConnected ? 'googleCalendar.connected' : 'googleCalendar.notConnected')
						}}
					</VChip>
				</div>
				<VBtn
					:color="googleCalendarConnected ? 'error' : 'primary'"
					:loading="googleCalendarLoading"
					size="small"
					@click="toggleGoogleCalendar"
				>
					{{ i18n.t(googleCalendarConnected ? 'googleCalendar.disconnect' : 'googleCalendar.connect') }}
				</VBtn>
			</div>
		</VCard>
		<div class="d-flex flex-column ga-2">
			<VBtn
				v-if="userStore.currentUser.twoFactorEnabled"
				color="info"
				@click="show2FAQrCode"
			>
				{{ i18n.t('user.show2FAQrCode') }}
			</VBtn>
			<VBtn
				v-if="userStore.currentUser.twoFactorEnabled"
				color="primary"
				@click="showScratchCode"
			>
				{{ i18n.t('user.newScratchCodes') }}
			</VBtn>
			<VBtn
				color="warning"
				@click="changePasswordDialog = true"
			>
				{{ i18n.t('user.changePassword') }}
			</VBtn>
			<VBtn
				color="error"
				@click="deleteAccount"
			>
				{{ i18n.t('user.deleteAccount') }}
			</VBtn>
		</div>
	</VCard>

	<ChangeEmailDialog
		ref="changeEmailDialog"
		:email="userStore.currentUser.email"
		@changed="onEmailChanged"
	/>
	<ChangePasswordDialog v-model="changePasswordDialog" />
	<VerifyUserDialog
		ref="verifyUserDialog"
		:url="verifyUserDialogData.url"
		@verified="verifyUserDialogData.onVerified"
	/>
</template>
<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/userStore.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { usePushNotifications } from '@/composables/general/UsePushNotifications.ts'
	import { useGoogleCalendarApi } from '@/api/googleCalendarApi.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import router from '@/plugins/router.ts'
	import ChangeEmailDialog from '@/components/user/dialogs/ChangeEmailDialog.vue'
	import ChangePasswordDialog from '@/components/user/dialogs/ChangePasswordDialog.vue'
	import VerifyUserDialog from '@/components/user/dialogs/VerifyUserDialog.vue'

	const i18n = useI18n()
	const userStore = useUserStore()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const {
		getStatus: getGoogleCalendarStatus,
		getAuthUrl,
		disconnect: disconnectGoogleCalendar,
	} = useGoogleCalendarApi()
	const {
		isSupported: pushSupported,
		isSubscribed: pushEnabled,
		subscribe: pushSubscribe,
		unsubscribe: pushUnsubscribe,
	} = usePushNotifications()

	const changeEmailDialog = ref<InstanceType<typeof ChangeEmailDialog>>()
	const changePasswordDialog = ref(false)
	const verifyUserDialog = ref<InstanceType<typeof VerifyUserDialog>>()
	const qrCodeImage = ref('')
	const googleCalendarConnected = ref(false)
	const googleCalendarLoading = ref(false)
	const isTwoFactorAuthEnabled = ref(userStore.currentUser.twoFactorEnabled)

	getGoogleCalendarStatus().then(connected => {
		googleCalendarConnected.value = connected
	})

	API.get<boolean>('/user/2fa/status').then(r => {
		isTwoFactorAuthEnabled.value = r.data
		userStore.currentUser.twoFactorEnabled = r.data
	})

	type TCurrentAction = 'toggleTwoFactorAuth' | 'deleteAccount' | 'show2FAQrCode' | 'showScratchCode'
	const currentAction = ref<TCurrentAction>('toggleTwoFactorAuth')

	const verifyUserDialogData = computed(() => {
		let url = '/user/verify'
		let onVerified: (data?: unknown) => void = () => {}
		switch (currentAction.value) {
			case 'deleteAccount':
				url = '/user/delete-account'
				onVerified = onDeleted
				break
			case 'toggleTwoFactorAuth':
				url = '/user/2fa/toggle'
				onVerified = onToggleTwoFactorAuth
				break
			case 'show2FAQrCode':
				url = '/user/2fa/reset'
				onVerified = onShow2FAQrCode
				break
			case 'showScratchCode':
				url = '/user/2fa/recovery-codes/regenerate'
				onVerified = onShowScratchCode
				break
		}
		return { url, onVerified }
	})

	async function toggleGoogleCalendar() {
		googleCalendarLoading.value = true
		try {
			if (googleCalendarConnected.value) {
				await disconnectGoogleCalendar()
				googleCalendarConnected.value = false
				showSuccessSnackbar(i18n.t('googleCalendar.disconnectSuccess'))
			} else {
				const url = await getAuthUrl()
				window.location.href = url
			}
		} catch {
			showErrorSnackbar(i18n.t('googleCalendar.connectFailed'))
		} finally {
			googleCalendarLoading.value = false
		}
	}

	async function togglePushNotifications(event: Event) {
		event.preventDefault()
		if (pushEnabled.value) {
			const success = await pushUnsubscribe()
			if (!success) showErrorSnackbar(i18n.t('user.pushNotificationsDisableFailed'))
			else showSuccessSnackbar(i18n.t('user.pushNotificationsDisabled'))
		} else {
			const success = await pushSubscribe()
			if (!success) showErrorSnackbar(i18n.t('user.pushNotificationsEnableFailed'))
			else showSuccessSnackbar(i18n.t('user.pushNotificationsEnabled'))
		}
	}

	function toggleTwoFactorAuth(event: Event) {
		event.preventDefault()
		currentAction.value = 'toggleTwoFactorAuth'
		verifyUserDialog.value?.open()
	}

	function deleteAccount() {
		currentAction.value = 'deleteAccount'
		verifyUserDialog.value?.open()
	}

	function onToggleTwoFactorAuth(data?: unknown) {
		const { twoFactorEnabled } = data as { twoFactorEnabled: boolean }
		userStore.currentUser.twoFactorEnabled = twoFactorEnabled
		isTwoFactorAuthEnabled.value = twoFactorEnabled
		showSuccessSnackbar(i18n.t(twoFactorEnabled ? 'user.twoFactorAuthEnabled' : 'user.twoFactorAuthDisabled'))
	}

	function onEmailChanged() {
		userStore.logout()
		router.push({ name: 'login' })
	}

	function onDeleted() {
		userStore.logout()
		router.push({ name: 'registration' })
	}

	function show2FAQrCode() {
		currentAction.value = 'show2FAQrCode'
		verifyUserDialog.value?.open()
	}

	function onShow2FAQrCode(data?: unknown) {
		const { qrCode } = data as { qrCode?: string }
		if (qrCode) {
			qrCodeImage.value = qrCode
		} else {
			showErrorSnackbar(i18n.t('user.noQrCodeReceived'))
		}
	}

	function showScratchCode() {
		currentAction.value = 'showScratchCode'
		verifyUserDialog.value?.open()
	}

	function onShowScratchCode(data?: unknown) {
		const codes = data as string[]
		if (!codes?.length) {
			showErrorSnackbar(i18n.t('user.noScratchCodeReceived'))
		}
		// TODO: display recovery codes to user
	}
</script>
