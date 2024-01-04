<template>
    <VRow justify="center" align="center" class="h-100">
        <VCol cols="11" sm="7" md="5" lg="4">
            <h2>{{ $t('authorization.forgotPassword') }}</h2>
            <h4 class="mb-3">{{ $t('authorization.enterEmailToResetPassword') }}</h4>
            <VForm @submit.prevent="resetPassword" class="text-center">
                <VTextField ref="email" class="mb-3 text-start" :label="$t('authorization.email')" v-model="email" :rules="emailRules" @input="emailNotFound = false"></VTextField>
                <VBtn type="submit" color="primary">{{ $t('authorization.resetPassword') }}</VBtn>
            </VForm>
        </VCol>
    </VRow>
    <VDialog v-model="dialog" width="auto" persistent>
        <VCard>
            <VCardTitle class="center">{{ $t('authorization.passwordReset') }}</VCardTitle>
            <VCardText>{{ $t('authorization.temporarryPasswordSent') }}</VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn color="success" @click="goToLogin">{{ $t('authorization.goToLogin') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
    <LoadingDialog :show="loading"></LoadingDialog>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { FormType } from '../classes/RefTypeInterfaces';
    import LoadingDialog from '../components/dialogs/LoadingDialog.vue';
    export default defineComponent({
        components:{
            LoadingDialog
        },
        data() {
            return {
                email: '',
                emailNotFound: false,
                emailRules: [
                    (v: string) => !!v || this.$t('authorization.emailRequired'),
                    (v: string) => this.validateEmail(v) || this.$t('authorization.invalidEmail'),
                    (v: string) => !this.isEmailNotFound() || this.$t('authorization.emailNotFound'),
                ],
                dialog: false,
                loading: false,
            };
        },
        methods: {
            isEmailNotFound() {
                return this.emailNotFound;
            },
            validateEmail(value: string) {
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                return emailRegex.test(value);
            },
            resetPassword() {
                this.loading = true;
                axios
                    .post('/user/auth/forgotten-password', { email: this.email })
                    .then((response) => {
                        this.dialog = true;
                        this.loading = false;
                    })
                    .catch((error) => {
                        if (error.response.status === 404) {
                            this.emailNotFound = true;
                            (this.$refs.email as FormType).validate();
                            this.loading = false;
                        } else {
                            console.log('Error', error.message);
                        }
                    });
            },
            goToLogin() {
                this.$router.push({ name: 'login' });
            },
        },
    });
</script>
