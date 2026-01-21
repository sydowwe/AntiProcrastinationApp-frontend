<template>
<VRow justify="center" class="mt-16">
	<VCol cols="12" sm="10" md="8" lg="6" class="d-flex flex-column">
		<h2 class="text-center mb-5">{{ i18n.t('user.userSettings') }}</h2>
		<VCard elevation="2" color="secondary">
			<VCardText class="pa-3 px-4 d-flex justify-space-between align-center">
					<span style="font-size: 1.07rem">
						<span>Email:</span>
						<strong class="px-2">{{ userData.email }}</strong>
					</span>
				<VBtn color="main" @click="changeEmailDialog?.open">{{ i18n.t('controls.edit') }}</VBtn>
			</VCardText>
		</VCard>
		<VSwitch class="mx-auto my-2" color="main" :label="i18n.t('user.use2FA')" v-model="isTwoFactorAuthEnabled" hide-details
		         density="compact" @click="toggleTwoFactorAuth"></VSwitch>
		<VRow justify="center">
			<VCol cols="10" sm="8" md="6" lg="6" class="d-flex flex-column ga-2">
				<VBtn v-if="userData.twoFactorEnabled" color="info" width="100%" @click="show2FAQrCode">
					{{ i18n.t('user.show2FAQrCode') }}
				</VBtn>
				<VBtn v-if="userData.twoFactorEnabled" @change="toggleTwoFactorAuth" color="primary" width="100%"
				      @click="showScratchCode">
					{{ i18n.t('user.newScratchCodes') }}
				</VBtn>
				<VBtn width="100%" color="warning" @click="changePasswordDialog = true">
					{{ i18n.t('user.changePassword') }}
				</VBtn>
				<VBtn width="100%" color="error" @click="deleteAccount">
					{{ i18n.t('user.deleteAccount') }}
				</VBtn>
			</VCol>
		</VRow>
	</VCol>
	<ChangeEmailDialog ref="changeEmailDialog" :email="userData.email" @changed="changedEmail"></ChangeEmailDialog>
	<ChangePasswordDialog v-model="changePasswordDialog"></ChangePasswordDialog>
	<VerifyUserDialog ref="verifyUserDialog" :url="verifyUserDialogData.url"
	                  @verified="verifyUserDialogData.onVerified"></VerifyUserDialog>
</VRow>
</template>
<script setup lang="ts">
import {computed, ref} from 'vue';
import ChangePasswordDialog from '../../components/user/dialogs/ChangePasswordDialog.vue';
import VerifyUserDialog from '@/components/user/dialogs/VerifyUserDialog.vue';

import {useI18n} from 'vue-i18n';
import ChangeEmailDialog from '@/components/user/dialogs/ChangeEmailDialog.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useUserStore} from '@/stores/userStore.ts';
import router from '@/plugins/router.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {User} from '@/dtos/response/User.ts';

const {showErrorSnackbar, showSuccessSnackbar, hideSnackbar} = useSnackbar();
const i18n = useI18n();
const userStore = useUserStore();

const changeEmailDialog = ref<InstanceType<typeof ChangeEmailDialog>>();
const changePasswordDialog = ref(false);
const verifyUserDialog = ref<InstanceType<typeof VerifyUserDialog>>();

const qrCode2FADialog = ref(false);

const userData = ref(new User());

const qrCodeImage = ref('');

const isTwoFactorAuthEnabled = ref(userData.value.twoFactorEnabled);

getUserData();

type TCurrentAction = 'toggleTwoFactorAuth' | 'deleteAccount' | 'show2FAQrCode' | 'showScratchCode'
const currentAction = ref<TCurrentAction>('toggleTwoFactorAuth')
const verifyUserDialogData = computed(() => {
	let url = '/user/verify';
	let onVerified = () => {
	};
	switch (currentAction.value) {
		case 'deleteAccount':
			url = '/user/delete-account';
			onVerified = onDeleted;
			break;
		case 'toggleTwoFactorAuth':
			url = '/user/toggle-two-factor-auth';
			onVerified = onToggleTwoFactorAuth;
			break;
		case 'show2FAQrCode':
			onVerified = onShow2FAQrCode;
			break;
		case 'showScratchCode':
			onVerified = onShowScratchCode;
			break;
	}
	return {url, onVerified};
})

function toggleTwoFactorAuth(event: Event) {
	event.preventDefault();
	currentAction.value = 'toggleTwoFactorAuth'
	verifyUserDialog.value?.open();
}

function deleteAccount() {
	currentAction.value = 'deleteAccount'
	verifyUserDialog.value?.open();
}

function getUserData(): void {
	API.post('/user/data', {})
		.then((response) => {
			userData.value = User.fromJson(response.data);
			isTwoFactorAuthEnabled.value = userData.value.twoFactorEnabled;
		})
		.catch((error) => {
			console.log(error);
		});
}

function onToggleTwoFactorAuth() {
	userData.value.twoFactorEnabled = !userData.value.twoFactorEnabled;
	isTwoFactorAuthEnabled.value = userData.value.twoFactorEnabled;
}

function changedEmail() {
	userStore.logout();
	router.push({name: 'login'});
}

function onDeleted() {
	userStore.logout();
	router.push({name: 'registration'});
}

function show2FAQrCode() {
	currentAction.value = 'show2FAQrCode';
	verifyUserDialog.value?.open();
}

function onShow2FAQrCode() {
	if (!qrCodeImage.value) {
		API.post('/user/get-2fa-qr-code', {})
			.then((response) => {
				if (response.data.qrCode) {
					qrCodeImage.value = response.data.qrCode;
					qrCode2FADialog.value = true;
				} else {
					console.log(response);
				}
			})
			.catch((error) => {
				console.error(error);
			});
	} else {
		qrCode2FADialog.value = true;
	}
}

function showScratchCode() {
	currentAction.value = 'showScratchCode';
	verifyUserDialog.value?.open();
}

function onShowScratchCode() {
	API.post('/user/get-2fa-scratch-code', {})
		.then((response) => {
			if (response.data.new2FAQrCode === true) {
				// TODO: Handle new QR code case
			} else {
				if (response.data.scratchCode) {
					// TODO: SHOW scratch code
				} else {
					console.error(response);
				}
			}
		})
		.catch((error) => {
			console.error(error);
		});
}
</script>
