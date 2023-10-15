<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-5">{{ $t('authorization.login') }}</h2>
            <VForm @submit.prevent="handleSubmit()" class="d-flex flex-column">
                <VTextField :label="$t('authorization.usernameOrEmail')" v-model="formData.login"></VTextField>
                <VTextField type="password" :label="$t('authorization.password')" v-model="formData.password"></VTextField>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn width="100%" color="success">{{ $t('authorization.logIn') }}</VBtn>
                        <div class="my-2 text-center">
                            {{ $t('authorization.dontHaveAccountYet') }}
                            <router-link to="/registration">{{ $t('authorization.register') }}</router-link>
                        </div>
                    </VCol>
                </VRow>
                <div class="dividerTextCenter mb-4">
                    <span class="text-center font-weight-medium mx-3">{{ $t('general.or') }}</span>
                </div>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn width="100%" color="primary">{{ $t('authorization.continueWithGoogle') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>
        <VDialog v-model="dialog" width="auto" persistent> 
            <VCard>
                <VCardTitle>{{ dialogTitle }}</VCardTitle>
                <VCardText>
                    <template v-if="!isError && body">
                        <verify-qr-code :personData="body" ref="verifyQrCode" :modalRef="modalRef"></verify-qr-code>
                    </template>
                    <template v-else>
                        {{ errorMessage }}
                    </template>
                </VCardText>
                <VCardActions class="d-flex justify-end mr-2 mb-2">
                    <VBtn color="error" @click="hideDialog">{{ $t('general.close') }}</VBtn>
                    <VBtn color="primary" v-if="!isError" @click="sumbitQR">{{ $t('general.send') }}</VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow>
</template>
<script>
    import VerifyQrCode from '../components/VerifyQrCode.vue';
    export default {
        components: {
            VerifyQrCode,
        },
        data() {
            return {
                modalRef: null,
                formData: {
                    login: '',
                    password: '',
                },
                dialogTitle: 'Dialog',
                dialog: false,
                body: null,
                isError: false,
                errorMessage: 'error',
            };
        },
        methods: {
            checkFormValidity() {},
            showDialog(title) {
                this.dialogTitle = title;
                this.dialog = true;
            },
            hideDialog() {
                this.dialog = false;
            },
            handleSubmit() {
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json',
                    url: '/zad1/api/login.php',
                    data: JSON.stringify(this.formData),
                    dataType: 'json',
                })
                    .done((data) => {
                        this.isError = data.error;
                        if (!this.isError) {
                            this.body = data.body;
                            this.showDialog('Google authenticator');
                        } else {
                            this.errorMessage = data.body;
                            this.showDialog('Chyba!');
                        }
                    })
                    .fail((error) => {
                        console.log(error);
                    });
            },
            sumbitQR() {
                const verifyQrCode = this.$refs.verifyQrCode;
                verifyQrCode.handleSubmit();
            },
        },
    };
</script>
