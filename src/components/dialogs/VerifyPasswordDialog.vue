<template>
    <VDialog v-model="dialog" persistent>
        <VRow justify="center" class="mt-16">
            <VCol cols="12" sm="10" md="8" lg="6">
                <VCard>
                    <VCardTitle class="center">{{ $t('user.toContinueEnterPassword') }}</VCardTitle>
                    <VCardText class="py-1">
                        <VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex flex-column align-items-center">
                            <VTextField                               
                                :label="$t('authorization.password')"
                                v-model="password"
                                :rules="passwordRules"
                                :type="showPassword ? 'text' : 'password'"
                                :append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
                                @click:append-inner="showPassword = !showPassword"
                                :loading="loading"
                            ></VTextField>
                        </VForm>
                    </VCardText>
                    <VCardActions class="d-flex justify-end mr-2 mb-2">
                        <VBtn color="error" @click="close">{{ $t('general.cancel') }}</VBtn>
                        <VBtn color="success" @click="validateAndSendForm">{{ $t('general.continue') }}</VBtn>
                    </VCardActions>
                </VCard>
            </VCol>
        </VRow>
    </VDialog>
</template>
<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { VuetifyFormType } from '../../classes/RefTypeInterfaces';
    export default defineComponent({
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            return { form };
        },
        data() {
            return {
                password: '',
                showPassword: false,
                passwordRules: [
                    (v: string) => !!v || this.$t('authorization.passwordRequired'),
                    (v: string) => v.length >= 8 || this.$t('authorization.invalidPasswordLength'),
                    (v: string) => this.validatePassword(v) || this.$t('authorization.invalidPassword'),
                ],
                dialog: false,
                loading: false,
            };
        },
        methods: {
            validatePassword(value: string) {
                const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
                return passwordRegex.test(value);
            },
            open() {
                this.dialog = true;
            },
            close() {
                this.dialog = false;
            },
            async validateAndSendForm() {
                this.loading = true;
                const { valid } = await this.form.validate();
                if (valid) {
                    axios
                        .post('/user/verify-password', this.password)
                        .then((response) => {
                            this.loading = false;                         
                            if (response.data) {
                                const needs2FA = response.data.needs2FA as boolean;
                                this.$emit('verified', needs2FA);
                                this.close();
                                this.password = '';
                            } else {
                                console.error('No data!!!');
                                this.password = '';
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            this.password = '';
                        });
                }
            },
        },
        emits: ['verified'],
    });
</script>
