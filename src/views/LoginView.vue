<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.login') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.email')" v-model="formData.email" :rules="emailRules"></VTextField>
                <VTextField
                    :label="$t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                ></VTextField>

                <VRow justify="center">
                    <VCol cols="12" sm="6" class="pb-0 pb-sm-3">
                        <VCheckbox :label="$t('authorization.stayLoggedIn')" v-model="formData.stayLoggedIn" hide-details></VCheckbox>
                    </VCol>
                    <VCol cols="12" sm="6" class="d-flex align-center justify-start justify-sm-end pt-2 pt-sm-3">
                        <RouterLink class="mx-3" to="/forgotten-password">{{ $t('authorization.forgotPassword') }}</RouterLink>
                    </VCol>
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn type="submit" width="100%" color="success">{{ $t('authorization.logIn') }}</VBtn>
                        <div class="mt-3 mb-2 text-center">
                            {{ $t('authorization.dontHaveAccountYet') }}
                            <RouterLink to="/registration">{{ $t('authorization.register') }}</RouterLink>
                        </div>
                    </VCol>
                </VRow>
                <div class="dividerTextCenter mb-4">
                    <span class="text-center font-weight-medium mx-3">{{ $t('general.or') }}</span>
                </div>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn width="100%" color="primary">{{ $t('authorization.continueWithGoogle') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>

        <VDialog v-model="dialog" width="auto" persistent>
            <VCard>
                <VCardTitle>{{ dialogTitle }}</VCardTitle>
                <VCardText>
                    <template v-if="!isError && formData.email">
                        <VerifyQrCode :email="formData.email" ref="verifyQrCode"></VerifyQrCode>
                    </template>
                    <template v-else>
                        {{ errorMessage }}
                    </template>
                </VCardText>
                <VCardActions class="d-flex justify-end mr-2 mb-2">
                    <VBtn color="error" @click="hideDialog">{{ $t('general.close') }}</VBtn>
                    <VBtn color="primary" v-if="!isError" @click="sumbitQR">{{ $t('general.send') }}</VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow>
</template>
<script>
    import VerifyQrCode from '../components/VerifyQrCode.vue';
    import { useUserStore } from '../plugins/stores/user';
    export default {
        components: {
            VerifyQrCode,
        },
        data() {
            return {
                formData: {
                    email: '',
                    password: '',
                    stayLoggedIn: false,
                },
                emailRules: [(v) => !!v || this.$t('authorization.emailRequired'), (v) => this.validateEmail(v) || this.$t('authorization.invalidEmail')],
                passwordRules: [(v) => !!v || this.$t('authorization.passwordRequired'), (v) => v.length >= 8 || this.$t('authorization.invalidPasswordLength')],
                showPassword: false,
                dialogTitle: 'Dialog',
                dialog: false,
                userData: null,
                isError: false,
                errorMessage: 'error',
            };
        },
        mounted() {
            this.formData.email = this.$route.params.email;
        },
        methods: {
            validateEmail(value) {
                if (value.includes('@')) {
                    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                    return emailRegex.test(value);
                } else {
                    // const alphanumericRegex = /^[a-zA-Z0-9_.-]+$/;
                    // return alphanumericRegex.test(value);
                    return false;
                }
            },
            async validateAndSendForm() {
                const { valid } = await this.$refs.form.validate();

                if (valid) {
                    axios
                        .post('/user/auth/login', this.formData)
                        .then((response) => {
                            console.log(response);
                            const userStore = useUserStore();
                            if (response.data?.token) {
                                userStore.setEmail(response.data.email);
                                userStore.setToken(response.data.token);
                                if (response.data.use2FA) {
                                    this.dialogTitle = 'Use google authenticator app'; //TODO preklad
                                    this.isError = false;
                                    this.this.dialog = true;
                                } else {
                                    this.$router.push('/');
                                }
                            } else {
                                console.error('No token!!!');
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            },
        },
    };
</script>