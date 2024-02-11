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
<script setup lang="ts">
    import { ref } from 'vue';
    import { VuetifyFormType } from '../../classes/types/RefTypeInterfaces';
    import { importDefaults } from '../../compositions/Defaults';
    const {i18n} = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
    const { dialog, open, close } = useDialogComposition();

    const form = ref<VuetifyFormType>({} as VuetifyFormType);

    const password = ref('');
    const showPassword = ref(false);
    const passwordRules = [
        (v: string) => !!v || i18n.t('authorization.passwordRequired'),
        (v: string) => v.length >= 8 || i18n.t('authorization.invalidPasswordLength'),
        (v: string) => validatePassword(v) || i18n.t('authorization.invalidPassword'),
    ];
    const loading = ref(false);
    function validatePassword(value: string) {
        const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
        return passwordRegex.test(value);
    }
    async function validateAndSendForm() {
        loading.value = true;
        const { valid } = await form.value.validate();
        if (valid) {
            axios
                .post('/user/verify-password', password.value)
                .then((response) => {
                    loading.value = false;
                    if (response.data) {
                        const needs2FA = response.data.needs2FA as boolean;
                        emit('verified', needs2FA);
                        close();
                    } else {
                        console.error('No data!!!');
                    }
                    password.value = '';
                })
                .catch((error) => {
                    console.log(error);
                    password.value = '';
                });
        }
    }
    const emit = defineEmits(['verified']);
    defineExpose({open});
</script>
