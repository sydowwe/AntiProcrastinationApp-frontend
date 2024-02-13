<template>
    <VRow justify="center" align="center" class="h-100">
        <VCol cols="11" sm="7" md="5" lg="4">
            <h2>{{ $t('authorization.forgotPassword') }}</h2>
            <h4 class="mb-3">{{ $t('authorization.enterEmailToResetPassword') }}</h4>
            <VForm @submit.prevent="resetPassword" ref="form" class="text-center">
                <VTextField class="mb-3 text-start" :label="$t('authorization.email')" v-model="email" :rules="emailRules"></VTextField>
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
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { useUserDetailsValidation } from '../compositions/UserAutorizationComposition';
    import { VuetifyFormType } from '../classes/types/RefTypeInterfaces';
    const { emailRules } = useUserDetailsValidation();
    import {importDefaults} from '../compositions/Defaults';
    const { showFullScreenLoading, hideFullScreenLoading, goToLogin, showErrorSnackbar } = importDefaults();
    const form = ref<VuetifyFormType>({} as VuetifyFormType);
    const email = ref('');
    const dialog = ref(false);

    async function resetPassword() {
        const { valid } = await form.value.validate();
        if (valid) {
            showFullScreenLoading();
            axios
                .post('/user/auth/forgotten-password', { email: email })
                .then((response) => {
                    dialog.value = true;
                })
                .catch((error) => {
                    if (error.response.status === 404) {
                        showErrorSnackbar('Email not found');
                    } else {
                        console.log('Error', error.message);
                    }
                })
                .finally(() => {
                    hideFullScreenLoading();
                });
        }
    }
</script>