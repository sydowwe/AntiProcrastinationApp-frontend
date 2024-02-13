<template>
    <VDialog v-model="dialog" persistent>
        <VRow justify="center">
            <VCol cols="12" sm="10" md="8" lg="4">
                <VCard class="pa-1">
                    <VCardTitle class="center">{{ i18n.t('user.passwordChange') }}</VCardTitle>
                    <VCardText class="py-1">
                        <VForm ref="form" @submit.prevent="validateAndEmit" class="d-flex flex-column align-items-center">
                            <VTextField
                                class="mb-3"
                                :label="i18n.t('user.newPassword')"
                                v-model="newPassword"
                                :rules="newPasswordRules"
                                :type="showNewPassword ? 'text' : 'password'"
                                :append-inner-icon="showNewPassword ? 'eye-slash' : 'eye'"
                                @click:append-inner="showNewPassword = !showNewPassword"
                            ></VTextField>
                            <VTextField
                                :label="i18n.t('user.confirmNewPassword')"
                                :rules="confirmNewPasswordRules"
                                :type="showConfirmNewPassword ? 'text' : 'password'"
                                :append-inner-icon="showConfirmNewPassword ? 'eye-slash' : 'eye'"
                                @click:append-inner="showConfirmNewPassword = !showConfirmNewPassword"
                            ></VTextField>
                        </VForm>
                    </VCardText>
                    <VCardActions class="d-flex justify-center mr-2 mb-2">
                        <VBtn color="error" @click="close">{{ i18n.t('general.cancel') }}</VBtn>
                        <VBtn color="success" @click="validateAndEmit">{{ i18n.t('general.save') }}</VBtn>
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
    const { i18n } = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
    const { dialog, open } = useDialogComposition();
    const form = ref<VuetifyFormType>({} as VuetifyFormType);

    const newPassword = ref('');
    const showNewPassword = ref(false);
    const showConfirmNewPassword = ref(false);
    const newPasswordRules = [
        (v: string) => !!v || i18n.t('authorization.passwordRequired'),
        (v: string) => v.length >= 8 || i18n.t('authorization.invalidPasswordLength'),
        (v: string) => validatePassword(v) || i18n.t('authorization.invalidPassword'),
    ];
    const confirmNewPasswordRules = [
        (v: string) => !!v || i18n.t('authorization.passwordRequired'),
        (v: string) => v.length >= 8 || i18n.t('authorization.invalidPasswordLength'),
        (v: string) => validatePassword(v) || i18n.t('authorization.invalidPassword'),
        (v: string) => doPasswordsMatch(v) || i18n.t('user.passwordsDontMatch'),
    ];
    function validatePassword(value: string) {
        const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
        return passwordRegex.test(value);
    }
    function doPasswordsMatch(value: string) {
        return value === newPassword.value;
    }
    function close() {
        dialog.value = false;
        form.value.reset();
    }
    async function validateAndEmit() {
        const { valid } = await form.value.validate();
        if (valid) {
            emit('change');
        }
    }
    async function submit() {
        const { valid } = await form.value.validate();
        if (valid) {
            axios
                .post('/user/change-password', newPassword.value)
                .then((response) => {
                    if (response.data) {
                        emit('changed');
                        close();
                    } else {
                        console.error('No user!!!');
                    }
                })
                .catch((error) => {
                    console.log(error);
                    form.value.reset();
                });
        }
    }
    const emit = defineEmits(['change', 'changed']);
    defineExpose({open});
</script>
