<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.login') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex flex-column">
                <VTextField class="mb-3" :label="$t('authorization.email')" v-model="formData.email" :rules="emailRules" :autofocus="!isRedirectedFromRegistration()"></VTextField>
                <VTextField
                    :label="$t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
                    @click:append-inner="showPassword = !showPassword"
                    :autofocus="isRedirectedFromRegistration()"
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
                <GoogleSignIn></GoogleSignIn>
            </VForm>
        </VCol>
        <VDialog v-model="dialog" width="small" persistent>
            <VCard>
                <VCardTitle>{{ dialogTitle }}</VCardTitle>
                <VCardText>
                    <LoginVerifyQrCode :email="formData.email" ref="verifyQrCode"></LoginVerifyQrCode>
                </VCardText>
                <VCardActions class="d-flex justify-end mr-2 mb-2">
                    <VBtn color="error" @click="dialog = false">{{ $t('general.close') }}</VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow>
</template>
<script lang="ts">
 import { RouterLink } from 'vue-router';
    import LoginVerifyQrCode from '../components/LoginVerifyQrCode.vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import { VuetifyFormType, SubmittableType } from '../classes/types/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    import { UserStoreItem } from '../classes/User';
    import GoogleSignIn from '../components/GoogleSignIn.vue';
    export default defineComponent({
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            const verifyQrCode = ref<SubmittableType>({} as SubmittableType);
            return { form, verifyQrCode };
        },
        components: {
            LoginVerifyQrCode,
            GoogleSignIn,
        },
        data() {
            return {
                formData: {
                    email: '',
                    password: '',
                    stayLoggedIn: false,
                },
                emailRules: [(v: string) => !!v || this.$t('authorization.emailRequired'), (v: string) => this.validateEmail(v) || this.$t('authorization.invalidEmail')],
                passwordRules: [(v: string) => !!v || this.$t('authorization.passwordRequired'), (v: string) => v.length >= 8 || this.$t('authorization.invalidPasswordLength')],
                showPassword: false,
                dialogTitle: 'Dialog',
                dialog: false,
            };
        },
        mounted() {
            this.formData.email = this.userStore.getEmail;
        },
        computed: {
            userStore() {
                return useUserStore();
            },
        },
        methods: {
            validateEmail(value: string) {
                const emailRegex = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,64}/;
                return emailRegex.test(value);
            },
            isRedirectedFromRegistration() {
                if (this.userStore.getEmail) {
                    return true;
                } else {
                    return false;
                }
            },
            async validateAndSendForm() {
                const { valid } = await this.form.validate();
                if (valid) {
                    axios
                        .post('/user/auth/login', this.formData)
                        .then((response) => {
                            if (response.data) {
                                const user = response.data as UserStoreItem;
                                this.userStore.setUser(user);
                                if (response.data.has2FA === true) {
                                    this.dialogTitle = this.$t('authorization.twoFA');
                                    this.dialog = true;
                                } else if (user.token) {
                                    this.$router.push('/');
                                } else {
                                    (this.$root as any).showErrorSnackbar('No token!!!');
                                    console.error('No token!!!');
                                }
                            } else {
                                (this.$root as any).showErrorSnackbar('No user!!!');
                                console.error('No user!!!');
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            if (error.response.status === 403 || error.response.status === 401) {
                                 (this.$root as any).showErrorSnackbar(this.$t('authorization.wrongEmailOrPassword'));
                            }
                        });
                }
            },
        },
    });
</script>
../classes/User../classes/types/RefTypeInterfaces
