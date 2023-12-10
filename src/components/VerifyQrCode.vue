<template>
    <VRow justify="center">
        <h4 class="w-100 pl-md-4">{{ $t('authorization.code2FA') }}</h4>
        <VCol cols="12" sm="10" md="8" lg="6">
            <VTextField :label="$t('authorization.code')" v-model="code" type="number" hide-details autofocus></VTextField>
        </VCol>
    </VRow>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useUserStore } from '../plugins/stores/user';
    export default defineComponent({
        props: {
            email: {
                type: String,
                required: true,
            },
            stayLoggedIn: {
                type: Boolean,
                required: true,
            },
        },
        data() {
            return {
                code: '',
            };
        },
        created() {},
        methods: {
            submit() {
                const googleAuthRequest = {
                    email: this.email,
                    code: this.code,
                    stayLoggedIn: this.stayLoggedIn,
                };
                axios
                    .post('/user/auth/validate2FA', googleAuthRequest)
                    .then((response) => {
                      console.log(response);
                        if (response.data?.authorized) {
                            if (response.data?.token) {
                                useUserStore().login(this.email, response.data.token);
                                this.$router.push('/');
                            } else {
                                console.error('No token!!!');
                            }
                        } else {
                            this.code = '';
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
        },
    });
</script>
