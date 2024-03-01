<template>
    <VDialog v-model="dialog" width="small" persistent>
        <VCard class="pa-1">
            <VCardTitle>{{ i18n.t('authorization.verifyYour2FA') }}</VCardTitle>
            <VCardText>
                <VRow justify="center">
                    <h4 class="w-100 pl-md-4">{{ i18n.t('authorization.code2FA') }}</h4>
                    <VCol cols="12" sm="10" md="8" lg="6">
                        <VOtpInput
                            @finish="submit"
                            :label="i18n.t('authorization.code')"
                            v-model="code"
                            hide-details
                            autofocus
                            focused
                            :error="isError"
                            :loading="loading"
                            @input="isError = false"
                        ></VOtpInput>
                    </VCol>
                </VRow>
            </VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn color="error" @click="close">{{ i18n.t('general.close') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { importDefaults } from '@/compositions/Defaults';
    const {i18n} = importDefaults();
    import { useDialogComposition } from '@/compositions/DialogComposition';
    const { dialog, open, close } = useDialogComposition();

    const code = ref('');
    const loading = ref(false);
    const isError = ref(false);

    function submit() {
        loading.value = true;
        axios
            .post('/user/validate2FA', code.value)
            .then((response) => {
                if (response.data.valid2FA === true) {
                    emit('verified');
                    close();
                    code.value = '';
                } else {
                    isError.value = true;
                    code.value = '';
                }
                loading.value = false;
            })
            .catch((error) => {
                console.log(error);
                loading.value = false;
                isError.value = true;
                code.value = '';
            });
    }
    const emit = defineEmits(['verified']);
    defineExpose({open});
</script>
