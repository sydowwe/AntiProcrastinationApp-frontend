<template>
    <VRow justify="center">
        <h4 class="w-100 pl-md-4">{{ $t('authorization.code2FA') }}</h4>
        <VCol cols="12" sm="10" md="8" lg="6">

            
        </VCol>
    </VRow>
</template>
<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import { VOtpInput } from 'vuetify/lib/labs/components.mjs';
    export default defineComponent({
        components: { VOtpInput },
        setup() {
            // const form = ref<>({} as);
            // return { form };
        },
        props: {
            email: {
                type: String,
                required: true,
            },            
        },
        data() {
            return {
                loading: false,
                error: false,
            };
        },
        created() {},
        methods: {
            submit() {
                axios
                    .post('/user/auth/validate2FA')
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
                        }
                        this.loading = false;
                    })
                    .catch((error) => {
                        console.log(error);
                        this.loading = false;
                        this.error = true;
                    });
            },
        },
    });
</script>