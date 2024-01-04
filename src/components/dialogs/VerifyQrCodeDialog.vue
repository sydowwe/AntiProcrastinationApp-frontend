<template>
    <VDialog v-model="dialog" width="small" persistent>
        <VCard>
            <VCardTitle>{{ $t('authorization.verifyYour2FA') }}</VCardTitle>
            <VCardText>
                <VRow justify="center">
                    <h4 class="w-100 pl-md-4">{{ $t('authorization.code2FA') }}</h4>
                    <VCol cols="12" sm="10" md="8" lg="6">
                        <VOtpInput
                            @finish="submit"
                            :label="$t('authorization.code')"
                            v-model="code"
                            hide-details
                            autofocus
                            focused
                            :error="error"
                            :loading="loading"
                            @input="error = false"
                        ></VOtpInput>
                    </VCol>
                </VRow>
            </VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn color="error" @click="close">{{ $t('general.close') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { VOtpInput } from 'vuetify/lib/labs/components.mjs';
    export default defineComponent({
        data() {
            return {
                dialog: false,
                code: '',
                loading: false,
                error: false,
            };
        },
        created() {},
        methods: {
            submit() {
                this.loading = true;
                axios
                    .post('/user/validate2FA', this.code)
                    .then((response) => {
                        if (response.data.valid2FA === true) {
                            this.$emit('verified');
                            this.close();
                            this.code = '';
                        } else {
                            this.error = true;
                            this.code = '';
                        }
                        this.loading = false;
                    })
                    .catch((error) => {
                        console.log(error);
                        this.loading = false;
                        this.error = true;
                        this.code = '';
                    });
            },
            open() {
                this.dialog = true;
            },
            close() {
                this.dialog = false;
            },
        },
        components: { VOtpInput },
        emits: ['verified']
    });
</script>
