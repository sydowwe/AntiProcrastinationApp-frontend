<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.login') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.usernameOrEmail')" v-model="formData.login" :rules="usernameEmailRules"></VTextField>
                <VTextField                    
                    :label="$t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                ></VTextField>
                <VCheckbox class="mb-2" :label="$t('authorization.stayLoggedIn')" v-model="formData.stayLoggedIn" hide-details></VCheckbox>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn type="submit" width="100%" color="success">{{ $t('authorization.logIn') }}</VBtn>
                        <div class="mt-3 mb-2 text-center">
                            {{ $t('authorization.dontHaveAccountYet') }}
                            <router-link to="/registration">{{ $t('authorization.register') }}</router-link>
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
                    <template v-if="!isError && body">
                        <verify-qr-code :personData="body" ref="verifyQrCode" :modalRef="modalRef"></verify-qr-code>
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
    export default {
        components: {
            VerifyQrCode,
        },
        data() {
            return {
                formData: {
                    login: '',
                    password: '',
                    stayLoggedIn: false,
                },
                usernameEmailRules: [
                    (v) => !!v || this.$t('authorization.usernameOrEmailRequired'),
                    (v) => this.validateUsernameOrEmail(v) || (v.includes('@') ? this.$t('authorization.invalidEmail') : this.$t('authorization.invalidUsername')),
                ],
                passwordRules: [(v) => !!v || this.$t('authorization.passwordRequired'), (v) => v.length >= 8 || this.$t('authorization.invalidPasswordLength')],
                showPassword: false,
                dialogTitle: 'Dialog',
                dialog: false,

                body: null,
                isError: false,
                errorMessage: 'error',
            };
        },
        methods: {
            validateUsernameOrEmail(value) {
                if (value.includes('@')) {
                    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                    return emailRegex.test(value);
                } else {
                    const alphanumericRegex = /^[a-zA-Z0-9_.-]+$/;
                    return alphanumericRegex.test(value);
                }
            },
            async validateAndSendForm() {
                const { valid } = await this.$refs.form.validate();

                if (valid) {
                    axios
                        .post('/user/login', this.formData)
                        .then((response) => {
                            console.log(response);
                            this.$router.push('/stopwatch');
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            },
            showDialog(title) {
                this.dialogTitle = title;
                this.dialog = true;
            },
            hideDialog() {
                this.dialog = false;
            },
        },
    };
</script>
