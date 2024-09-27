<template>
    <VDialog v-model="dialog" persistent>
        <VRow justify="center">
            <VCol cols="12" sm="10" md="8" lg="4">
                <VCard class="pa-1">
                    <VCardTitle>{{ $t('user.toContinueEnterPassword') }}</VCardTitle>
                    <VCardText class="py-0 mt-1">
                        <VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex ga-3 flex-column align-items-center">
	                        <MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
	                        <MyTwoFactorAuthInput ref="twoFactorAuthInput" v-model="twoFactorAuthToken" :isTwoFactorAuthError="isTwoFactorAuthError"></MyTwoFactorAuthInput>
                        </VForm>
                    </VCardText>
                    <VCardActions class="d-flex justify-center mr-2 mb-2">
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
    import {MyTwoFactorAuthInputType, VuetifyFormType} from '../../classes/types/RefTypeInterfaces';
    import { importDefaults } from '../../compositions/Defaults';
    import {useI18n} from 'vue-i18n';
const i18n = useI18n();
const {showErrorSnackbar} = importDefaults();
    import { useDialogComposition } from '@/compositions/DialogComposition';
    import MyTwoFactorAuthInput from '@/components/MyTwoFactorAuthInput.vue';
    import MyVerifyPasswordInput from '@/components/MyVerifyPasswordInput.vue';
    const { dialog, open, close } = useDialogComposition();

    const form = ref<VuetifyFormType>({} as VuetifyFormType);

    const password = ref<string | null>(null);

    const loading = ref(false);

    const twoFactorAuthToken = ref<string | null>(null);
    const isTwoFactorAuthError = ref(false);
    const twoFactorAuthInput = ref<MyTwoFactorAuthInputType>({});

    function open() {
	    if(!await twoFactorAuthInput.value.triggerVisibilityCheck()){
		    dialog.value = true;
	    }
    }

    async function validateAndSendForm() {
        loading.value = true;
        const { valid } = await form.value.validate();
        if (valid) {
            axios
                .post('/user/verify', {
					password: password.value,
	                twoFactorAuthToken: twoFactorAuthToken.value
                })
                .then((response) => {
	                console.log(response)
                    loading.value = false;
                    if (typeof response.data == 'boolean') {
                        emit('verified', response.data);
                        close();
                    } else {
                        console.error('No data!!!');
                    }
                    form.value.reset();
                })
                .catch((error) => {
                    console.log(error);
                    loading.value = false;
                    form.value.reset();
                    showErrorSnackbar(i18n.t('authorization.wrongPassword'),{timeout:3000})
                }); 
        }else{
            loading.value = false;
        }
    }
    const emit = defineEmits(['verified']);
    defineExpose({open});
</script>
