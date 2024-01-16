<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.registration') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.name')" v-model="formData.name" :rules="nameRules" autofocus></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.surname')" v-model="formData.surname" :rules="surnameRules"></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.email')" v-model="formData.email" :rules="emailRules"></VTextField>
                <VTextField
                    :label="$t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
                    @click:append-inner="showPassword = !showPassword"
                ></VTextField>
                <VCheckbox :label="$t('authorization.use2FASetup')" v-model="formData.use2FA" hide-details></VCheckbox>
                <VCheckbox class="mb-3" v-model="termsAndConditions" :rules="termsAndConditionsRules">
                    <template v-slot:label>
                        {{ $t('general.iAgreeTo') }}&nbsp;
                        <RouterLink to="/terms-and-conditions">
                            {{ $t('authorization.termsAndConditions') }}
                        </RouterLink>
                    </template>
                </VCheckbox>

                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn type="submit" width="100%" color="success">{{ $t('authorization.register') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>
        <QrCodeFor2FADialog ref="qrCode2FADialog" :qrCodeImage="qrCodeImage" @done="goToLogin"></QrCodeFor2FADialog>
        <ErrorDialog ref="errorDialog" :title="errodDialogTitle" :message="errorDialogMessage"></ErrorDialog>
        <LoadingFullscreen :show="loading"></LoadingFullscreen>
    </VRow>
</template>

<script lang="ts">
    import { useUserStore } from '../plugins/stores/userStore';
    import { VuetifyFormType, DialogType } from '../classes/types/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    import QrCodeFor2FADialog from '../components/dialogs/QrCodeFor2FADialog.vue';
    import ErrorDialog from '../components/dialogs/ErrorDialog.vue';
    import LoadingFullscreen from '../components/dialogs/LoadingFullscreen.vue';
    export default defineComponent({
        components: {
            QrCodeFor2FADialog,
            ErrorDialog,
            LoadingFullscreen
        },
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            const qrCode2FADialog = ref<DialogType>({} as DialogType);
            const errorDialog = ref<DialogType>({} as DialogType);
            return { form, qrCode2FADialog, errorDialog };
        },
        data() {
            return {
                formData: {
                    name: '',
                    surname: '',
                    email: '',
                    password: '',
                    use2FA: true,
                },
                googleAuthCode: '',
                termsAndConditions: false,
                nameRules: [(v: string) => !!v || this.$t('authorization.nameRequired'), (v: string) => this.validateName(v) || this.$t('authorization.invalidName')],
                surnameRules: [(v: string) => !!v || this.$t('authorization.surnameRequired'), (v: string) => this.validateSurname(v) || this.$t('authorization.invalidSurname')],
                emailRules: [(v: string) => !!v || this.$t('authorization.emailRequired'), (v: string) => this.validateEmail(v) || this.$t('authorization.invalidEmail')],
                passwordRules: [
                    (v: string) => !!v || this.$t('authorization.passwordRequired'),
                    (v: string) => v.length >= 8 || this.$t('authorization.invalidPasswordLength'),
                    (v: string) => this.validatePassword(v) || this.$t('authorization.invalidPassword'),
                ],
                termsAndConditionsRules: [(v: boolean) => v !== false || this.$t('authorization.termsAndConditionsRequired')],
                showPassword: false,

                qrCodeImage: '',

                loading: false,

                errodDialogTitle: 'Dialog',
                errorDialogMessage: '',
            };
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
                const emailRegex = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,64}/;
                return emailRegex.test(value);
            },
            // validateUsername(value) {
            //     const alphanumericRegex = /^[a-zA-Z0-9_.-]+$/;
            //     return alphanumericRegex.test(value);
            // },
            validatePassword(value: string) {
                const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
                return passwordRegex.test(value);
            },
            async validateAndSendForm() {
                const { valid } = await this.form.validate();
                if (valid) {
                    axios
                        .post('/user/auth/register', this.formData)
                        .then((response) => {
                            const userStore = useUserStore();
                            if (response.data?.email) {
                                userStore.setEmail(response.data.email);
                                if (response.data?.has2FA) {
                                    if (response.data.qrCode) {
                                        this.qrCodeImage = response.data.qrCode;
                                        this.qrCode2FADialog.open();
                                    } else {
                                        console.error('No qrCode!!!');
                                    }
                                } else {
                                    this.goToLogin();
                                }
                            } else {
                                console.error('No email!!!');
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            },
            goToLogin() {
                this.$router.push({ name: 'login' });
            },
        },
    });
</script>
<style>
    .v-checkbox > .v-input__details {
        margin-top: -7px;
        padding-top: 0px !important;
        padding-left: 16px;
    }
</style>
../classes/types/RefTypeInterfaces