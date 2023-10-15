<template>
    <VRow justify="center" class="mt-16">
        <VCol cols="12" sm="10" md="8" lg="6">
            <h2 class="text-center mb-2">{{ $t('authorization.registration') }}</h2>
            <VForm @submit.prevent="handleSubmit" class="d-flex flex-column">
                <VTextField :label="$t('authorization.name')" v-model="formData.name"></VTextField>
                <VTextField :label="$t('authorization.surname')" v-model="formData.surname"></VTextField>
                <VTextField :label="$t('authorization.username')" v-model="formData.username"></VTextField>
                <VTextField :label="$t('authorization.email')" v-model="formData.email"></VTextField>
                <VTextField :label="$t('authorization.password')" v-model="formData.password"></VTextField>
                <VRow justify="center">
                    <VCol cols="10" sm="8" md="6" lg="6">
                        <VBtn width="100%" color="success">{{ $t('authorization.register') }}</VBtn>
                    </VCol>
                </VRow>
            </VForm>
        </VCol>
        <VDialog v-model="dialog" width="auto" persistent>
            <VCard>
                <VCardTitle>{{ dialogTitle }}</VCardTitle>
                <VCardText>
                    <template v-if="!isError">
                        <div class="d-flex flex-column align-items-center">
                            <span id="qrPrompt">Scan QR code with google authentificator app: </span>
                            <img :src="qrcodeUrl" alt="qr code for 2fa" />
                        </div>
                    </template>
                    <template v-else>
                        {{ errorMessage }}
                    </template>
                </VCardText>
                <VCardActions class="d-flex justify-end mr-2 mb-2">
                    <VBtn color="error" @click="hideDialog">{{ $t('general.close') }}</VBtn>
                    <router-link id="redirect" class="btn btn-success" to="/login" v-if="!isError">Prejsť na prihlásenie</router-link>
                </VCardActions>
            </VCard>
        </VDialog>
    </VRow> 
</template>

<script>
    export default {
        components: {},
        data() {
            return {
                formData: {
                    name: '',
                    surname: '',
                    username: '',
                    email: '',
                    password: '',
                },
                dialogTitle: 'Dialog',
                dialog: false,
                qrcodeUrl: '',
                isError: false,
                errorMessage: '',
                invalidFields: [],
            };
        },   
        methods: {
            showDialog(title) {
                this.dialogTitle = title;
                this.dialog = true;
            },
            hideDialog() {
                this.dialog = false;
            },
          
            handleSubmit() {
                if (this.checkFormValidity()) {
                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json',
                        url: '/zad1/api/register.php',
                        data: JSON.stringify(this.formData),
                        dataType: 'json',
                    })
                        .done((data) => {
                            this.isError = data.error;
                            if (!this.isError) {
                                this.qrcodeUrl = data.body;
                                this.showModal('QR Code');
                            } else {
                                this.errorMessage = `User with username: ${data.body.username} or email: ${data.body.email} already exists`;
                                this.showModal('Chyba!');
                            }
                        })
                        .fail((error) => {
                            console.log(error);
                        });
                }
            },
            // validateTextField(fieldId) {
            //     const fieldValue = this.formData[fieldId];
            //     const regex = /^[A-Za-z]+([ -.]?[A-Za-z]+)*$/;
            //     if (!regex.test(fieldValue)) {
            //         if (!this.invalidFields.includes(fieldId)) {
            //             this.invalidFields.push(fieldId);
            //         }
            //     } else {
            //         const index = this.invalidFields.indexOf(fieldId);
            //         if (index !== -1) {
            //             this.invalidFields.splice(index, 1);
            //         }
            //     }
            // },
            // validateEmail(fieldId) {
            //     const fieldValue = this.formData[fieldId];
            //     const regex = /^\w{2,}([.-]?\w+)@\w+([.-]?\w+)(.\w{2,4})+$/;
            //     if (!regex.test(fieldValue)) {
            //         if (!this.invalidFields.includes(fieldId)) {
            //             this.invalidFields.push(fieldId);
            //         }
            //     } else {
            //         const index = this.invalidFields.indexOf(fieldId);
            //         if (index !== -1) {
            //             this.invalidFields.splice(index, 1);
            //         }
            //     }
            // },
            // checkFormValidity() {
            //     const invalidFieldsTexts = [];
            //     this.$el.querySelectorAll('[data-required]').forEach((field) => {
            //         if (!field.value.trim()) {
            //             const label = this.$el.querySelector(`label[for=${field.id}]`).textContent;
            //             invalidFieldsTexts.push(label);
            //             this.isError = true;
            //         }
            //     });

            //     if (this.invalidFields.length > 0) {
            //         this.invalidFields.forEach((fieldId) => {
            //             console.log(fieldId);
            //             const label = this.$el.querySelector(`label[for=${fieldId}]`).textContent;
            //             invalidFieldsTexts.push(label);
            //             this.isError = true;
            //         });
            //     }

            //     if (this.isError) {
            //         this.errorModalMessage = `Nasledujúce polia sú neplatné: ${invalidFieldsTexts.join(', ')}. Prosím, opravte ich.`;
            //         this.showModal('Chyba!');
            //         return false;
            //     }
            //     return true;
            // },
        },
    };
</script>
