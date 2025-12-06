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
				<VBtn color="main" @click="changeEmailDialog.open">{{ i18n.t('controls.edit') }}</VBtn>
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
import type {DialogType, VuetifyFormType} from '@/types/RefTypeInterfaces.ts';
import {User} from '@/dtos/response/User.ts';

const {showErrorSnackbar, showSuccessSnackbar, hideSnackbar} = useSnackbar();
const i18n = useI18n();
const userStore = useUserStore();
const form = ref<VuetifyFormType>({} as VuetifyFormType);

const changeEmailDialog = ref<DialogType>({} as DialogType);
const changePasswordDialog = ref(false);
const verifyUserDialog = ref<DialogType>({} as DialogType);

const qrCode2FADialog = ref(false);

const userData = ref(new User());

const qrCodeImage = ref('');

const isTwoFactorAuthEnabled = ref(userData.value.twoFactorEnabled);

getUserData();

type TCurrentAction = 'toggleTwoFactorAuth' | 'deleteAccount'
const currentAction = ref<TCurrentAction>('toggleTwoFactorAuth')
const verifyUserDialogData = computed(() => {
	let url = '';
	let onVerified = () => {
	};
	switch (currentAction.value) {
		case 'deleteAccount':
			url = `/user/delete-account`
			onVerified = onDeleted;
			break;
		case 'toggleTwoFactorAuth':
			url = `/user/toggle-two-factor-auth`
			onVerified = onToggleTwoFactorAuth;
			break;
	}
	return {url, onVerified};
})

function toggleTwoFactorAuth(event: Event) {
	event.preventDefault();
	currentAction.value = 'toggleTwoFactorAuth'
	verifyUserDialog.value.open();
}

function deleteAccount() {
	currentAction.value = 'deleteAccount'
	verifyUserDialog.value.open();
}

function getUserData(): void {
	API.post('/user/data', {})
		.then((response) => {
			userData.value = User.fromJson(response.data);
			console.log(userData.value);
		})
		.catch((error) => {
			console.log(error);
		});
}

const onToggleTwoFactorAuth = () => {
	userData.value.twoFactorEnabled = isTwoFactorAuthEnabled.value;
}

const changedEmail = () => {
	userStore.logout();
	router.push({name: 'login'});
}

const onDeleted = () => {
	userStore.logout();
	router.push({name: 'registration'});
}

function show2FAQrCode() {
	onUserVerified.value = () => {
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
	};
	verifyPasswordDialog.value.open();
}

function showScratchCode() {
	onUserVerified.value = () => {
		API
			.post('/user/get-2fa-scratch-code', {})
			.then((response) => {
				if (response.data.new2FAQrCode === true) {
				} else {
					if (response.data.scratchCode) {
						//TODO SHOW scratch code
					} else {
						console.error(response);
					}
				}
			})
			.catch((error) => {
				console.error(error);
			});
	};
	verifyPasswordDialog.value.open();
}
</script>
