<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('user.userSettings') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.name')" v-model="userData.name" :rules="nameRules" autofocus></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.surname')" v-model="userData.surname" :rules="surnameRules"></VTextField>
                <VTextField class="mb-0" :label="$t('authorization.email')" v-model="userData.email" :rules="emailRules"></VTextField>
                <div class="d-flex flex-column-reverse flex-sm-row mb-4 mt-0">
                    <VCheckbox :label="$t('user.use2FA')" v-model="userData.has2FA" hide-details density="compact"></VCheckbox>
                    <VBtn v-if="userData.has2FA" class="mb-1 mb-sm-0 mx-auto" color="info" @click="show2FAQrCode" style="width: fit-content !important">{{ $t('user.show2FAQrCode') }}</VBtn>
                    <VBtn v-if="userData.has2FA" class="mb-1 mb-sm-0 mx-auto" color="danger" @click="showScratchCode" style="width: fit-content !important">{{ $t('user.showScratchCode') }}</VBtn>
                </div>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn class="mb-2" type="submit" width="100%" color="success">{{ $t('general.save') }}</VBtn>
                        <VBtn class="mb-2" width="100%" color="warning" @click="changePasswordDialog.open">{{ $t('user.changePassword') }}</VBtn>
                        <VBtn class="mb-2" width="100%" color="error" @click="deleteAccount">{{ $t('user.deleteAccount') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>
        <VerifyPasswordDialog ref="verifyPasswordDialog" @verified="passwordVerified"></VerifyPasswordDialog>
        <VerifyQrCodeDialog ref="verifyQrCodeDialog" @verified="currentFunction"></VerifyQrCodeDialog>
        <ChangePasswordDialog ref="changePasswordDialog" @change="changePassword"></ChangePasswordDialog>
        <QrCodeFor2FADialog ref="qrCode2FADialog" :qrCodeImage="qrCodeImage" @done=""></QrCodeFor2FADialog>
        <ErrorDialog ref="errorDialog" :title="errodDialogTitle" :message="errorDialogMessage"></ErrorDialog>
    </VRow>
</template>
<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import { VuetifyFormType, DialogType, DialogFormType } from '../classes/types/RefTypeInterfaces';
    import { User, UserRequest } from '../classes/User';
    import VerifyQrCodeDialog from '../components/dialogs/VerifyQrCodeDialog.vue';
    import ChangePasswordDialog from '../components/dialogs/ChangePasswordDialog.vue';
    import VerifyPasswordDialog from '../components/dialogs/VerifyPasswordDialog.vue';
    import QrCodeFor2FADialog from '../components/dialogs/QrCodeFor2FADialog.vue';
    import ErrorDialog from '../components/dialogs/ErrorDialog.vue';
    export default defineComponent({
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            const verifyPasswordDialog = ref<DialogType>({} as DialogType);
            const verifyQrCodeDialog = ref<DialogType>({} as DialogType);
            const changePasswordDialog = ref<DialogFormType>({} as DialogFormType);
            const qrCode2FADialog = ref<DialogType>({} as DialogType);
            const errorDialog = ref<DialogType>({} as DialogType);

            return { form, verifyQrCodeDialog, changePasswordDialog, verifyPasswordDialog, qrCode2FADialog, errorDialog };
        },
        components: { VerifyQrCodeDialog, ChangePasswordDialog, VerifyPasswordDialog, QrCodeFor2FADialog, ErrorDialog },
        data() {
            return {
                userData: new User(),
                currentFunction: this.saveChanges as (...args: any[]) => any,
                qrCodeImage: '',

                nameRules: [(v: string) => !!v || this.$t('authorization.nameRequired'), (v: string) => this.validateName(v) || this.$t('authorization.invalidName')],
                surnameRules: [(v: string) => !!v || this.$t('authorization.surnameRequired'), (v: string) => this.validateSurname(v) || this.$t('authorization.invalidSurname')],
                emailRules: [(v: string) => !!v || this.$t('authorization.emailRequired'), (v: string) => this.validateEmail(v) || this.$t('authorization.invalidEmail')],

                errodDialogTitle: '',
                errorDialogMessage: '',
            };
        },
        created() {
            this.getUserData();
        },
        computed: {
            userStore() {
                return useUserStore();
            },
            userRequest() {
                return UserRequest.fromUser(this.userData);
            },
        },
        methods: {
            validateName(value: string) {
                const letterRegex = /^[a-zA-Z ]+$/;
                return letterRegex.test(value);
            },
            validateSurname(value: string) {
                const letterRegex = /^[a-zA-Z ]+$/;
                return letterRegex.test(value);
            },
            validateEmail(value: string) {
                //     const regex = /^[A-Za-z]+([ -.]?[A-Za-z]+)*$/;
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                return emailRegex.test(value);
            },
            async validateAndSendForm() {
                const { valid } = await this.form.validate();
                if (valid) {
                    if (await this.wereSensitiveChangesMade()) {
                        this.currentFunction = this.saveChanges;
                        this.verifyPasswordDialog.open();
                    } else {
                        this.saveChanges();
                    }
                }
            },
            async wereSensitiveChangesMade(): Promise<boolean> {
                return await axios
                    .post('/user/were-sensitive-changes-made', this.userRequest)
                    .then((response) => {
                        return response.data as boolean;
                    })
                    .catch((error) => {
                        console.log(error);
                        return true;
                    });
            },
            saveChanges(): void {
                axios
                    .put('/user/edit-logged-user-data', this.userRequest)
                    .then((response) => {
                        this.userData = User.fromObject(response.data);
                        this.userStore.setEmail(this.userData.email);
                        if (response.data.token) {
                            this.userStore.setToken(response.data.token);
                        }
                        if (response.data.qrCode) {
                            console.log(response.data);
                            this.qrCodeImage = response.data.qrCode;
                            this.qrCode2FADialog.open();
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            getUserData(): void {
                axios
                    .post('/user/get-logged-user-data', {})
                    .then((response) => {
                        this.userData = User.fromObject(response.data);
                        this.userStore.setEmail(this.userData.email);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            passwordVerified(needs2FA: boolean) {
                if (needs2FA) {
                    this.verifyQrCodeDialog.open();
                } else if (this.currentFunction) {
                    this.currentFunction();
                }
            },
            changePassword(): void {
                this.currentFunction = this.changePasswordDialog.submit;
                this.verifyPasswordDialog.open();
            },
            deleteAccount(): void {
                this.currentFunction = () => {
                    axios
                        .delete('/user/delete-my-account', {})
                        .then((response) => {
                            console.log(response);
                            this.userStore.logout();
                            this.$router.push({ name: 'registration' });
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                };
                this.verifyPasswordDialog.open();
            },
            show2FAQrCode() {
                this.currentFunction = () => {
                    if (!this.qrCodeImage) {
                        axios
                            .post('/user/get-2fa-qr-code', {})
                            .then((response) => {
                                if (response.data.qrCode) {
                                    this.qrCodeImage = response.data.qrCode;
                                    this.qrCode2FADialog.open();
                                } else {
                                    console.log(response);
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    } else {
                        this.qrCode2FADialog.open();
                    }
                };
                this.verifyPasswordDialog.open();
            },
            showScratchCode() {
                this.currentFunction = () => {
                    axios
                        .post('/user/get-2fa-scratch-code', {})
                        .then((response) => {
                            if (response.data.new2FAQrCode === true) {
                                
                            }
                            else{
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
                this.verifyPasswordDialog.open();
            },
        },
    });
</script>
../classes/User../classes/types/RefTypeInterfaces