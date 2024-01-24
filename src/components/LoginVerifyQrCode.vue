<template>
    <VRow justify="center">
        <h4 class="w-100 pl-md-4">{{ $t('authorization.code2FA') }}</h4>
        <VCol cols="12" sm="10" md="8" lg="6">
            <VOtpInput @finish="submit" :label="$t('authorization.code')" v-model="code" hide-details autofocus focused :error="error" :loading="loading" @input="error = false"></VOtpInput>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import { VOtpInput } from 'vuetify/lib/labs/components.mjs';
    import importDefaults from '../compositions/Defaults';
    const { router } = importDefaults();

    const props = defineProps({
        email: {
            type: String,
            required: true,
        },
    });
    const code = ref('');
    const loading = ref(false);
    const error = ref(false);

    function submit() {
        const googleAuthRequest = {
            email: props.email,
            code: code.value,
        };
        loading.value = true;
        axios
            .post('/user/auth/validate2FA', googleAuthRequest)
            .then((response) => {
                if (response.data?.authorized) {
                    if (response.data?.token) {
                        useUserStore().setToken(response.data?.token);
                        router.push('/');
                    } else {
                        error.value = true;
                        console.error('No token!!!');
                    }
                } else {
                    error.value = true;
                    code.value = '';
                }
                loading.value = false;
            })
            .catch((_error) => {
                console.log(_error);
                loading.value = false;
                error.value = true;
                code.value = '';
            });
    }
</script>
