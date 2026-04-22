<template>
	<VRow
		justify="center"
		class="mt-16"
	>
		<VCol
			cols="12"
			sm="10"
			md="8"
			lg="6"
			class="d-flex flex-column"
		>
			<h2 class="text-center mb-5">{{ i18n.t('user.userSettings') }}</h2>
			<VCard
				elevation="2"
				color="secondary"
			>
				<VCardText class="pa-3 px-4 d-flex justify-space-between align-center">
					<span style="font-size: 1.07rem">
						<span>{{ i18n.t('authorization.email') }}:</span>
						<strong class="px-2">{{ userData.email }}</strong>
					</span>
					<VBtn
						color="main"
						@click="changeEmailDialog?.open"
					>
						{{ i18n.t('controls.edit') }}
					</VBtn>
				</VCardText>
			</VCard>
			<VSwitch
				v-model="isTwoFactorAuthEnabled"
				class="mx-auto my-2"
				color="main"
				:label="i18n.t('user.use2FA')"
				hideDetails
				density="compact"
				@click="toggleTwoFactorAuth"
			></VSwitch>
			<VSwitch
				v-if="pushSupported"
				v-model="pushEnabled"
				class="mx-auto my-2"
				color="main"
				:label="i18n.t('user.pushNotifications')"
				hideDetails
				density="compact"
				@click="togglePushNotifications"
			></VSwitch>
			<VRow justify="center">
				<VCol
					cols="10"
					sm="8"
					md="6"
					lg="6"
					class="d-flex flex-column ga-2"
				>
					<VBtn
						v-if="userData.twoFactorEnabled"
						color="info"
						width="100%"
						@click="show2FAQrCode"
					>
						{{ i18n.t('user.show2FAQrCode') }}
					</VBtn>
					<VBtn
						v-if="userData.twoFactorEnabled"
						color="primary"
						width="100%"
						@change="toggleTwoFactorAuth"
						@click="showScratchCode"
					>
						{{ i18n.t('user.newScratchCodes') }}
					</VBtn>
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
									{{ i18n.t(googleCalendarConnected ? 'googleCalendar.connected' : 'googleCalendar.notConnected') }}
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
					<VBtn
						width="100%"
						color="warning"
						@click="changePasswordDialog = true"
					>
						{{ i18n.t('user.changePassword') }}
					</VBtn>
					<VBtn
						width="100%"
						color="error"
						@click="deleteAccount"
					>
						{{ i18n.t('user.deleteAccount') }}
					</VBtn>
				</VCol>
			</VRow>
		</VCol>
		<ChangeEmailDialog
			ref="changeEmailDialog"
			:email="userData.email"
			@changed="changedEmail"
		></ChangeEmailDialog>
		<ChangePasswordDialog v-model="changePasswordDialog"></ChangePasswordDialog>
		<VerifyUserDialog
			ref="verifyUserDialog"
			:url="verifyUserDialogData.url"
			@verified="verifyUserDialogData.onVerified"
		></VerifyUserDialog>
	</VRow>
</template>
<script setup lang="ts">
	import { computed, ref } from 'vue'
	import ChangePasswordDialog from '../../components/user/dialogs/ChangePasswordDialog.vue'
	import VerifyUserDialog from '@/components/user/dialogs/VerifyUserDialog.vue'

	import { useI18n } from 'vue-i18n'
	import { handleHttpCodes } from '@/composables/general/ErrorHandlingFunctions.ts'
	import ChangeEmailDialog from '@/components/user/dialogs/ChangeEmailDialog.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { usePushNotifications } from '@/composables/general/UsePushNotifications.ts'
	import { useUserStore } from '@/stores/userStore.ts'
	import router from '@/plugins/router.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import { User } from '@/dtos/response/user/User.ts'
	import { useGoogleCalendarApi } from '@/api/googleCalendarApi.ts'

	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { getStatus: getGoogleCalendarStatus, getAuthUrl, disconnect: disconnectGoogleCalendar } = useGoogleCalendarApi()

	const googleCalendarConnected = ref(false)
	const googleCalendarLoading = ref(false)

	getGoogleCalendarStatus().then(connected => {
		googleCalendarConnected.value = connected
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
	const i18n = useI18n()
	const userStore = useUserStore()
	const {
		isSupported: pushSupported,
		isSubscribed: pushEnabled,
		subscribe: pushSubscribe,
		unsubscribe: pushUnsubscribe,
	} = usePushNotifications()

	const changeEmailDialog = ref<InstanceType<typeof ChangeEmailDialog>>()
	const changePasswordDialog = ref(false)
	const verifyUserDialog = ref<InstanceType<typeof VerifyUserDialog>>()

	const qrCode2FADialog = ref(false)

	const userData = ref(new User())

	const qrCodeImage = ref('')

	const isTwoFactorAuthEnabled = ref(userData.value.twoFactorEnabled)

	getUserData()

	type TCurrentAction = 'toggleTwoFactorAuth' | 'deleteAccount' | 'show2FAQrCode' | 'showScratchCode'
	const currentAction = ref<TCurrentAction>('toggleTwoFactorAuth')
	const verifyUserDialogData = computed(() => {
		let url = '/user/verify'
		let onVerified = () => {}
		switch (currentAction.value) {
			case 'deleteAccount':
				url = '/user/delete-account'
				onVerified = onDeleted
				break
			case 'toggleTwoFactorAuth':
				url = '/user/toggle-two-factor-auth'
				onVerified = onToggleTwoFactorAuth
				break
			case 'show2FAQrCode':
				onVerified = onShow2FAQrCode
				break
			case 'showScratchCode':
				onVerified = onShowScratchCode
				break
		}
		return { url, onVerified }
	})

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

	function getUserData(): void {
		API.post('/user/data', {})
			.then(response => {
				userData.value = User.fromJson(response.data)
				isTwoFactorAuthEnabled.value = userData.value.twoFactorEnabled
			})
			.catch(error => {
				handleHttpCodes(error.response?.status)
			})
	}

	function onToggleTwoFactorAuth() {
		userData.value.twoFactorEnabled = !userData.value.twoFactorEnabled
		isTwoFactorAuthEnabled.value = userData.value.twoFactorEnabled
		showSuccessSnackbar(
			i18n.t(userData.value.twoFactorEnabled ? 'user.twoFactorAuthEnabled' : 'user.twoFactorAuthDisabled'),
		)
	}

	function changedEmail() {
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

	function onShow2FAQrCode() {
		if (!qrCodeImage.value) {
			API.post('/user/get-2fa-qr-code', {})
				.then(response => {
					if (response.data.qrCode) {
						qrCodeImage.value = response.data.qrCode
						qrCode2FADialog.value = true
					} else {
						showErrorSnackbar(i18n.t('user.noQrCodeReceived'))
					}
				})
				.catch(error => {
					handleHttpCodes(error.response?.status)
				})
		} else {
			qrCode2FADialog.value = true
		}
	}

	function showScratchCode() {
		currentAction.value = 'showScratchCode'
		verifyUserDialog.value?.open()
	}

	function onShowScratchCode() {
		API.post('/user/get-2fa-scratch-code', {})
			.then(response => {
				if (response.data.new2FAQrCode === true) {
					// TODO: Handle new QR code case
				} else {
					if (response.data.scratchCode) {
						// TODO: SHOW scratch code
					} else {
						showErrorSnackbar(i18n.t('user.noScratchCodeReceived'))
					}
				}
			})
			.catch(error => {
				handleHttpCodes(error.response?.status)
			})
	}
</script>
