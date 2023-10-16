<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.registration') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.name')" v-model="formData.name" :rules="nameRules"></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.surname')" v-model="formData.surname" :rules="surnameRules"></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.username')" v-model="formData.username" :rules="usernameRules"></VTextField>
                <VTextField class="mb-3" :label="$t('authorization.email')" v-model="formData.email" :rules="emailRules"></VTextField>
                <VTextField 
                    :label="$t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'faEyeSlash' : 'faEye'"
                    @click:append-inner="showPassword = !showPassword"
                ></VTextField>
                <VCheckbox class="mb-3" v-model="termsAndConditions" hide-details>
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

        <VDialog v-model="dialog" width="auto" persistent>
            <VCard>
                <VCardTitle>{{ dialogTitle }}</VCardTitle>
                <VCardText>
                    <template v-if="!isError">
                        <div class="d-flex flex-column align-items-center">
                            <span id="qrPrompt">Scan QR code with google authentificator app: </span>
                            <img :src="qrcodeUrl" alt="qr code for 2fa" />
                        </div>
                    </template>
                    <template v-else>
                        {{ errorMessage }}
                    </template>
                </VCardText>
                <VCardActions class="d-flex justify-end mr-2 mb-2">
                    <VBtn color="error" @click="hideDialog">{{ $t('general.close') }}</VBtn>
                    <router-link id="redirect" class="btn btn-success" to="/login" v-if="!isError">Prejsť na prihlásenie</router-link>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow>
</template>

<script>
    export default {
        components: {},
        data() {
            return {
                formData: {
                    name: '',
                    surname: '',
                    username: '',
                    email: '',
                    password: '',
                    wantsGoogleAuth: false,
                },
                googleAuthCode: '',
                termsAndConditions: false,
                nameRules: [(v) => !!v || this.$t('authorization.nameRequired'), (v) => this.validateName(v) || this.$t('authorization.invalidName')],
                surnameRules: [(v) => !!v || this.$t('authorization.surnameRequired'), (v) => this.validateSurname(v) || this.$t('authorization.invalidSurname')],
                usernameRules: [(v) => !!v || this.$t('authorization.usernameRequired'), (v) => this.validateUsername(v) || this.$t('authorization.invalidUsername')],
                emailRules: [(v) => !!v || this.$t('authorization.emailRequired'), (v) => this.validateEmail(v) || this.$t('authorization.invalidEmail')],
                passwordRules: [
                    (v) => !!v || this.$t('authorization.passwordRequired'),
                    (v) => v.length >= 8 || this.$t('authorization.invalidPasswordLength'),
                    (v) => this.validatePassword(v) || this.$t('authorization.invalidPassword'),
                ],
                showPassword: false,
                dialogTitle: 'Dialog',
                dialog: false,
                qrcodeUrl: '',
                isError: false,
                errorMessage: '',
            };
        },
        methods: {
            validateName(value) {
                const letterRegex = /^[a-zA-Z ]+$/;
                return letterRegex.test(value);
            },
            validateSurname(value) {
                const letterRegex = /^[a-zA-Z ]+$/;
                return letterRegex.test(value);
            },
            validateEmail(value) {
                //     const regex = /^[A-Za-z]+([ -.]?[A-Za-z]+)*$/;
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                return emailRegex.test(value);
            },
            validateUsername(value) {
                const alphanumericRegex = /^[a-zA-Z0-9_.-]+$/;
                return alphanumericRegex.test(value);
            },
            validatePassword(value) {
                const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
                return passwordRegex.test(value);
            },
            showDialog(title) {
                this.dialogTitle = title;
                this.dialog = true;
            },
            hideDialog() {
                this.dialog = false;
            },
            async validateAndSendForm() {
                const { valid } = await this.$refs.form.validate();

                if (valid) {
                    axios
                        .post('/user/register', this.formData)
                        .then((response) => {
                            console.log(response);
                            this.isError = data.error;
                            if (!this.isError) {
                                this.qrcodeUrl = data.body;
                                this.showModal('QR Code');
                            } else {
                                this.errorMessage = `User with username: ${data.body.username} or email: ${data.body.email} already exists`;
                                this.showModal('Chyba!');
                            }
                            this.$router.push('/login');
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            },
        },
    };
</script>
