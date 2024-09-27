<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ i18n.t('user.userSettings') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
                <VTextField class="mb-3" :label="i18n.t('authorization.name')" v-model="userData.name" :rules="nameRules" autofocus></VTextField>
                <VTextField class="mb-3" :label="i18n.t('authorization.surname')" v-model="userData.surname" :rules="surnameRules"></VTextField>
                <VTextField class="mb-0" :label="i18n.t('authorization.email')" v-model="userData.email" :rules="emailRules"></VTextField>
                <div class="d-flex flex-column-reverse flex-sm-row mb-4 mt-0">
                    <VSwitch :label="i18n.t('user.use2FA')" v-model="userData.twoFactorEnabled" hide-details density="compact"></VSwitch>
                    <VBtn v-if="userData.twoFactorEnabled" class="mb-1 mb-sm-0 mx-auto" color="info" @click="show2FAQrCode" style="width: fit-content !important">{{ i18n.t('user.show2FAQrCode') }}</VBtn>
                    <VBtn v-if="userData.twoFactorEnabled" class="mb-1 mb-sm-0 mx-auto" color="danger" @click="showScratchCode" style="width: fit-content !important">{{ i18n.t('user.showScratchCode') }}</VBtn>
                </div>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn class="mb-2" type="submit" width="100%" color="success">{{ i18n.t('general.save') }}</VBtn>
                        <VBtn class="mb-2" width="100%" color="warning" @click="changePasswordDialog.open">{{ i18n.t('user.changePassword') }}</VBtn>
                        <VBtn class="mb-2" width="100%" color="error" @click="deleteAccount">{{ i18n.t('user.deleteAccount') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>
        <ChangePasswordDialog ref="changePasswordDialog"></ChangePasswordDialog>
	    <VerifyUserDialog ref="verifyUserDialog" @verified="onUserVerified"></VerifyUserDialog>
        <ErrorDialog ref="errorDialog" :title="errorDialogTitle" :message="errorDialogMessage"></ErrorDialog>
    </VRow>
</template>
<script setup lang="ts">
    import { ref, computed } from 'vue';
    import ChangePasswordDialog from '../../components/dialogs/ChangePasswordDialog.vue';
    import VerifyUserDialog from '@/components/dialogs/VerifyUserDialog.vue';

    import ErrorDialog from '../../components/dialogs/ErrorDialog.vue';
    import { VuetifyFormType, DialogType, DialogFormType } from '@/classes/types/RefTypeInterfaces';
    import { User, UserRequest } from '@/classes/User';
    import {importDefaults} from '@/compositions/Defaults';
    import { useUserDetailsValidation } from '@/compositions/UserAutorizationComposition';
    import {useLoadingStore} from '@/stores/globalFeedbackStores';
    import {useI18n} from 'vue-i18n';
    const { router, userStore, showErrorSnackbar, showSuccessSnackbar, hideSnackbar } = importDefaults();
    const { emailRules, nameRules, surnameRules } = useUserDetailsValidation();
    const i18n = useI18n();
    const form = ref<VuetifyFormType>({} as VuetifyFormType);

    const changePasswordDialog = ref<DialogFormType>({} as DialogFormType);
    const verifyUserDialog = ref<DialogType>({} as DialogType);
    const qrCode2FADialog = ref<DialogType>({} as DialogType);
    const errorDialog = ref<DialogType>({} as DialogType);

    const userData = ref(new User());
    const onUserVerified = ref(saveChanges as (...args: any[]) => any);

    const qrCodeImage = ref('');

    const errorDialogTitle = ref('Dialog');
    const errorDialogMessage = ref('');

    getUserData();

    const userRequest = computed(() => UserRequest.fromUser(userData.value));

    async function validateAndSendForm() {
        const { valid } = await form.value.validate();
        if (valid) {
            if (await wereSensitiveChangesMade()) {
                currentFunction.value = saveChanges;
                verifyPasswordDialog.value.open();
            } else {
                saveChanges();
            }
        }
    }
    function saveChanges(): void {
        axios
            .put('/user/edit', userRequest.value)
            .then((response) => {
                userData.value = User.fromObject(response.data);
                userStore.setEmail(userData.value.email);
                if (response.data.qrCode) {
                    console.log(response.data);
                    qrCodeImage.value = response.data.qrCode;
                    qrCode2FADialog.value.open();
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }
    function getUserData(): void {
        axios
            .post('/user/data', {})
            .then((response) => {
                userData.value = User.fromObject(response.data);
	            console.log(userData.value);

                userStore.setEmail(userData.value.email);
            })
            .catch((error) => {
                console.log(error);
            });
    }


    function deleteAccount(): void {
        onUserVerified.value = () => {
	        useLoadingStore().axiosSuccessLoadingHide = false;
	        axios
                .delete('/user/delete-my-account', {})
                .then((response) => {
                    console.log(response);
                    userStore.logout();
                    router.push({ name: 'registration' });
                })
                .catch((error) => {
                    console.log(error);
                });
        };
        verifyUserDialog.value.open();
    }







    function show2FAQrCode() {
        onUserVerified.value = () => {
            if (!qrCodeImage.value) {
                axios
                    .post('/user/get-2fa-qr-code', {})
                    .then((response) => {
                        if (response.data.qrCode) {
                            qrCodeImage.value = response.data.qrCode;
                            qrCode2FADialog.value.open();
                        } else {
                            console.log(response);
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else {
                qrCode2FADialog.value.open();
            }
        };
        verifyPasswordDialog.value.open();
    }

    function showScratchCode() {
        onUserVerified.value = () => {
            axios
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