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
					<span class="settings-label">
						<span>{{ i18n.t('authorization.email') }}:</span>
						<strong class="px-2">{{ userData.email }}</strong>
					</span>
					<VBtn
						color="primary"
						@click="changeEmailDialog.open"
					>
						{{ i18n.t('controls.edit') }}
					</VBtn>
				</VCardText>
			</VCard>
			<VCard
				elevation="2"
				color="secondary"
				class="mt-3"
			>
				<VCardText class="pa-3 px-4 d-flex justify-space-between align-center">
					<span class="settings-label">{{ i18n.t('user.theme') }}</span>
					<VBtn
						:prependIcon="isDark ? 'sun' : 'moon'"
						color="primary"
						@click="toggleTheme"
					>
						{{ isDark ? i18n.t('user.switchToLight') : i18n.t('user.switchToDark') }}
					</VBtn>
				</VCardText>
			</VCard>
			<VSwitch
				class="mx-auto my-2"
				color="primary"
				:label="i18n.t('user.use2FA')"
				v-model="isTwoFactorAuthEnabled"
				hideDetails
				density="compact"
				@click="toggleTwoFactorAuth"
			></VSwitch>
			<VSwitch
				class="mx-auto my-2"
				color="primary"
				:label="pushSupported ? i18n.t('notifications.enablePush') : i18n.t('notifications.pushUnsupported')"
				:modelValue="pushSubscribed"
				:disabled="!pushSupported"
				hideDetails
				density="compact"
				@click="onTogglePush"
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
						@click="showScratchCode"
					>
						{{ i18n.t('user.newScratchCodes') }}
					</VBtn>
					<VBtn
						width="100%"
						color="warning"
						@click="changePasswordDialog = true"
					>
						{{ i18n.t('user.changePassword') }}
					</VBtn>
					<VBtn
						width="100%"
						color="info"
						prependIcon="file-shield"
						:loading="dataExportLoading"
						@click="downloadMyData"
					>
						{{ i18n.t('employee.gdprExport.selfButton') }}
					</VBtn>
					<p class="text-caption text-center text-medium-emphasis mb-0">
						{{ i18n.t('employee.gdprExport.loggedNotice') }}
					</p>
					<VBtn
						width="100%"
						color="error"
						@click="deleteAccount"
					>
						{{ i18n.t('user.deleteAccount') }}
					</VBtn>
				</VCol>
			</VRow>
			<MyDocumentsSection />
			<MyAcknowledgmentsSection />
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
		<QrCodeFor2FADialog
			v-model="qrCode2FADialog"
			:qrCodeImage
		></QrCodeFor2FADialog>
		<ScratchCodeDialog
			v-model="scratchCodeDialog"
			:scratchCode
		></ScratchCodeDialog>
	</VRow>
</template>
<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { usePushNotifications } from '@/core/notifications/composable/UsePushNotifications.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useTheme } from 'vuetify/framework'
	import ChangePasswordDialog from '@/core/user/component/dialogs/ChangePasswordDialog.vue'
	import VerifyUserDialog from '@/core/user/component/dialogs/VerifyUserDialog.vue'
	import QrCodeFor2FADialog from '@/core/user/component/dialogs/QrCodeFor2FADialog.vue'
	import ScratchCodeDialog from '@/core/user/component/dialogs/ScratchCodeDialog.vue'

	import { User } from '@/core/user/dto/User.ts'
	import { useI18n } from 'vue-i18n'
	import ChangeEmailDialog from '@/core/user/component/dialogs/ChangeEmailDialog.vue'
	import MyDocumentsSection from '@/core/user/component/MyDocumentsSection.vue'
	import MyAcknowledgmentsSection from '@/core/user/component/MyAcknowledgmentsSection.vue'
	import router from '@/router.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'
	import { fetchUserData, getQrCode, getScratchCode } from '@/core/user/api/UserApi.ts'
	import type { AxiosError } from 'axios'
	import { exportMyData } from '@/core/employee/employee/api/EmployeeApi.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'

	const authStore = useAuthStore()
	const i18n = useI18n()
	const theme = useTheme()

	const isDark = computed(() => theme.global.current.value.dark)

	const {
		isSupported: pushSupported,
		isSubscribed: pushSubscribed,
		permission: pushPermission,
		subscribe,
		unsubscribe,
		initPushSupport,
	} = usePushNotifications()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	onMounted(initPushSupport)

	async function onTogglePush(): Promise<void> {
		if (pushPermission.value === 'denied') {
			showErrorSnackbar(i18n.t('notifications.pushBlocked'))
			return
		}
		if (pushSubscribed.value) {
			const ok = await unsubscribe()
			if (ok) showSuccessSnackbar(i18n.t('notifications.pushUnsubscribed'))
		} else {
			const ok = await subscribe()
			if (ok) {
				showSuccessSnackbar(i18n.t('notifications.pushSubscribed'))
			} else {
				showErrorSnackbar(i18n.t('notifications.enableError'))
			}
		}
	}

	const dataExportLoading = ref(false)

	async function downloadMyData() {
		if (dataExportLoading.value) return
		dataExportLoading.value = true
		try {
			const { blob, fileName } = await exportMyData()
			const yyyyMMdd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
			downloadBlob(blob, fileName ?? `my-data-export-${yyyyMMdd}.json`)
			showSuccessSnackbar(i18n.t('employee.gdprExport.success'))
		} catch (e) {
			const status = (e as AxiosError).response?.status ?? 0
			if (status === 403) {
				showErrorSnackbar(i18n.t('employee.gdprExport.errors.selfAnonymized'))
			} else if (status === 404) {
				showErrorSnackbar(i18n.t('employee.gdprExport.errors.noLinkedRecord'))
			} else {
				showErrorSnackbar(i18n.t('employee.gdprExport.errors.generic'))
			}
		} finally {
			dataExportLoading.value = false
		}
	}

	function toggleTheme() {
		const newTheme = isDark.value ? 'light' : 'dark'
		theme.change(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	const changeEmailDialog = ref<InstanceType<typeof ChangeEmailDialog>>()
	const changePasswordDialog = ref(false)
	const verifyUserDialog = ref<InstanceType<typeof VerifyUserDialog>>()

	const qrCode2FADialog = ref(false)
	const scratchCodeDialog = ref(false)

	const userData = ref(new User())

	const qrCodeImage = ref('')
	const scratchCode = ref<string | string[]>('')

	const isTwoFactorAuthEnabled = computed(() => userData.value.twoFactorEnabled)

	getUserData()

	type TCurrentAction = 'toggleTwoFactorAuth' | 'deleteAccount' | 'show2FAQrCode' | 'showScratchCode'
	const currentAction = ref<TCurrentAction>('toggleTwoFactorAuth')
	const verifyUserDialogData = computed(() => {
		let url = ''
		let onVerified = () => {}
		switch (currentAction.value) {
			case 'deleteAccount':
				url = `/user/delete-account`
				onVerified = onDeleted
				break
			case 'toggleTwoFactorAuth':
				url = `/user/toggle-two-factor-auth`
				onVerified = onToggleTwoFactorAuth
				break
			case 'show2FAQrCode':
				url = `/user/verify`
				onVerified = onShow2FAQrCode
				break
			case 'showScratchCode':
				url = `/user/verify`
				onVerified = onShowScratchCode
				break
		}
		return { url, onVerified }
	})

	function toggleTwoFactorAuth(event: Event) {
		event.preventDefault()
		currentAction.value = 'toggleTwoFactorAuth'
		verifyUserDialog.value?.open()
	}

	function deleteAccount() {
		currentAction.value = 'deleteAccount'
		verifyUserDialog.value?.open()
	}

	async function getUserData(): Promise<void> {
		try {
			userData.value = await fetchUserData()
		} catch {
			// The axios interceptor already surfaces the error to the user.
		}
	}

	function onToggleTwoFactorAuth() {
		userData.value.twoFactorEnabled = !userData.value.twoFactorEnabled
	}

	function changedEmail() {
		authStore.logout()
		router.push({ name: 'login' })
	}

	function onDeleted() {
		authStore.logout()
		router.push({ name: 'registration' })
	}

	function show2FAQrCode() {
		currentAction.value = 'show2FAQrCode'
		verifyUserDialog.value?.open()
	}

	function showScratchCode() {
		currentAction.value = 'showScratchCode'
		verifyUserDialog.value?.open()
	}

	async function onShow2FAQrCode() {
		try {
			if (!qrCodeImage.value) {
				qrCodeImage.value = await getQrCode()
			}
			if (qrCodeImage.value) {
				qrCode2FADialog.value = true
			}
		} catch {
			showErrorSnackbar(i18n.t('user.qrCodeError'))
		}
	}

	async function onShowScratchCode() {
		try {
			const data = await getScratchCode()
			if (data.scratchCode) {
				scratchCode.value = data.scratchCode
				scratchCodeDialog.value = true
			} else {
				showErrorSnackbar(i18n.t('user.scratchCodeError'))
			}
		} catch {
			showErrorSnackbar(i18n.t('user.scratchCodeError'))
		}
	}
</script>

<style scoped>
	.settings-label {
		font-size: 1.07rem;
	}
</style>
