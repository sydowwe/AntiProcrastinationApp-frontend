<template>
    <VRow justify="center">
        <h4 class="w-100 pl-md-4">{{ $t('authorization.code2FA') }}</h4>
        <VCol cols="12" sm="10" md="8" lg="6">
            <VOtpInput @finish="submit" :label="$t('authorization.code')" v-model="code" hide-details autofocus focused :error="error" :loading="loading" @input="error = false"></VOtpInput>
        </VCol>
    </VRow>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import { VOtpInput } from 'vuetify/lib/labs/components.mjs';
    export default defineComponent({
        props: {
            email: {
                type: String,
                required: true,
            },            
        },
        data() {
            return {
                code: '',
                loading: false,
                error: false,
            };
        },
        created() {},
        methods: {
            submit() {
                const googleAuthRequest = {
                    email: this.email,
                    code: this.code,                   
                };
                this.loading = true;
                axios
                    .post('/user/auth/validate2FA', googleAuthRequest)
                    .then((response) => {
                        if (response.data?.authorized) {
                            if (response.data?.token) {
                                useUserStore().setToken(response.data?.token);
                                this.$router.push('/');
                            } else {
                                this.error = true;
                                console.error('No token!!!');
                            }
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
        },
        components: { VOtpInput },
    });
</script>
