<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ i18n.t('authorization.login') }}</h2>
            <VForm ref="form" @submit.prevent="validateAndSendForm()" validateOn="submit" class="d-flex flex-column">
                <VTextField class="mb-3" :label="i18n.t('authorization.email')" v-model="formData.email" :rules="emailRules" :autofocus="!isRedirectedFromRegistration"></VTextField>
                <VTextField
                    :label="i18n.t('authorization.password')"
                    v-model="formData.password"
                    :rules="passwordRulesLog"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
                    @click:append-inner="showPassword = !showPassword"
                    :autofocus="isRedirectedFromRegistration"
                ></VTextField>
                <VRow justify="center">
                    <VCol cols="12" sm="6" class="pb-0 pb-sm-3">
                        <VCheckbox :label="i18n.t('authorization.stayLoggedIn')" v-model="formData.stayLoggedIn" hide-details></VCheckbox>
                    </VCol>
                    <VCol cols="12" sm="6" class="d-flex align-center justify-start justify-sm-end pt-2 pt-sm-3">
                        <RouterLink class="mx-3" to="/forgotten-password">{{ i18n.t('authorization.forgotPassword') }}</RouterLink>
                    </VCol>
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn type="submit" width="100%" color="success">{{ i18n.t('authorization.logIn') }}</VBtn>
                        <div class="mt-3 mb-2 text-center">
                            {{ i18n.t('authorization.dontHaveAccountYet') }}
                            <RouterLink to="/registration">{{ i18n.t('authorization.register') }}</RouterLink>
                        </div>
                    </VCol>
                </VRow>
                <div class="dividerTextCenter mb-4">
                    <span class="text-center font-weight-medium mx-3">{{ i18n.t('general.or') }}</span>
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
                    <VBtn color="error" @click="dialog = false">{{ i18n.t('general.close') }}</VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow>
</template>
<script setup lang="ts">
    import { ref, onMounted, computed } from 'vue';
    import { VuetifyFormType, SubmittableType } from '@/classes/types/RefTypeInterfaces';
    import { UserStoreItem } from '@/classes/User';
    import GoogleSignIn from '../components/GoogleSignIn.vue';
    import LoginVerifyQrCode from '../components/LoginVerifyQrCode.vue';
    import {importDefaults} from '@/compositions/Defaults';
    const { router,i18n, userStore, showErrorSnackbar, showFullScreenLoading, hideFullScreenLoading } = importDefaults();
    import { useUserDetailsValidation } from '@/compositions/UserAutorizationComposition';
    const { emailRules, passwordRulesLog } = useUserDetailsValidation();

    const form = ref<VuetifyFormType>({} as VuetifyFormType);
    const verifyQrCode = ref<SubmittableType>({} as SubmittableType);
    const formData = ref({
        email: '',
        password: '',
        stayLoggedIn: false,
    });
  
    const showPassword = ref(false);
    const dialogTitle = ref('Dialog');
    const dialog = ref(false);

    onMounted(() => {
        formData.value.email = userStore.getEmail;
    });    
    const isRedirectedFromRegistration = computed(()=>!!userStore.getEmail);

    async function validateAndSendForm() {
        const { valid } = await form.value.validate();
        if (valid) {
            axios
                .post('/user/auth/login', JSON.stringify(formData.value))
                .then((response) => {
                    if (response.data) {
                        const user = response.data as UserStoreItem;
                        userStore.setUser(user);
                        if (response.data.has2FA === true) {
                            dialogTitle.value = 'authorization.twoFA';
                            dialog.value = true;
                        } else if (user.token) {
                            router.push('/');
                        } else {
                            showErrorSnackbar('No token!!!');
                            console.error('No token!!!');
                        }
                    } else {
                        showErrorSnackbar('No user!!!');
                        console.error('No user!!!');
                    }
                })
                .catch((error) => {
                    console.log(error);
                    if (error.response.status === 403 || error.response.status === 401) {
                        showErrorSnackbar(i18n.t('authorization.wrongEmailOrPassword'));
                    }
                });
        }
    }
</script>