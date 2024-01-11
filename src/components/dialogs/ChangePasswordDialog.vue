<template>
    <VDialog v-model="dialog" persistent>
        <VRow justify="center" class="mt-16">
            <VCol cols="12" sm="10" md="8" lg="6">
                <VCard>
                    <VCardTitle class="center">{{ $t('user.passwordChange') }}</VCardTitle>
                    <VCardText class="py-1">
                        <VForm ref="form" @submit.prevent="validateAndEmit" class="d-flex flex-column align-items-center">
                            <VTextField
                                class="mb-3"
                                :label="$t('user.newPassword')"
                                v-model="newPassword"
                                :rules="newPasswordRules"
                                :type="showNewPassword ? 'text' : 'password'"
                                :append-inner-icon="showNewPassword ? 'eye-slash' : 'eye'"
                                @click:append-inner="showNewPassword = !showNewPassword"
                            ></VTextField>
                            <VTextField
                                :label="$t('user.confirmNewPassword')"
                                :rules="confirmNewPasswordRules"
                                :type="showConfirmNewPassword ? 'text' : 'password'"
                                :append-inner-icon="showConfirmNewPassword ? 'eye-slash' : 'eye'"
                                @click:append-inner="showConfirmNewPassword = !showConfirmNewPassword"
                            ></VTextField>
                        </VForm>
                    </VCardText>
                    <VCardActions class="d-flex justify-end mr-2 mb-2">
                        <VBtn color="error" @click="close">{{ $t('general.cancel') }}</VBtn>
                        <VBtn color="success" @click="validateAndEmit">{{ $t('general.save') }}</VBtn>
                    </VCardActions>
                </VCard>
            </VCol>
        </VRow>
    </VDialog>
</template>
<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { VuetifyFormType } from '../../classes/types/RefTypeInterfaces';
    export default defineComponent({
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            return { form };
        },
        data() {
            return {
                newPassword: '',
                showNewPassword: false,
                showConfirmNewPassword: false,
                newPasswordRules: [
                    (v: string) => !!v || this.$t('authorization.passwordRequired'),
                    (v: string) => v.length >= 8 || this.$t('authorization.invalidPasswordLength'),
                    (v: string) => this.validatePassword(v) || this.$t('authorization.invalidPassword'),
                ],
                confirmNewPasswordRules: [
                    (v: string) => !!v || this.$t('authorization.passwordRequired'),
                    (v: string) => v.length >= 8 || this.$t('authorization.invalidPasswordLength'),
                    (v: string) => this.validatePassword(v) || this.$t('authorization.invalidPassword'),
                    (v: string) => this.doPasswordsMatch(v) || this.$t('user.passwordsDontMatch'),
                ],
                dialog: false,
            };
        },
        methods: {
            validatePassword(value: string) {
                const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
                return passwordRegex.test(value);
            },
            doPasswordsMatch(value: string) {
                return value === this.newPassword;
            },
            open() {
                this.dialog = true;
            },
            close() {
                this.dialog = false;
                this.newPassword = '';
            },
            async validateAndEmit() {
                const { valid } = await this.form.validate();
                if (valid) {
                    this.$emit("change");
                }
            },
            async submit() {
                const { valid } = await this.form.validate();
                if (valid) {
                    axios
                    .post('/user/change-password', this.newPassword)
                    .then((response) => {
                        if (response.data) {
                            this.$emit('changed');
                            this.close();
                        } else {
                            console.error('No user!!!');
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                }                
            },
        },
        emits: ['change', 'changed'],
    });
</script>
../../classes/types/RefTypeInterfaces