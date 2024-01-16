<template>
    <VRow justify="center" no>
        <VCol cols="10" sm="8" md="6" lg="6">
            <GoogleLogin class="w-100" :callback="callback">
                <VBtn width="100%" color="primary"
                    >{{ $t('authorization.continueWithGoogle') }}
                    <VIcon class="ml-1">
                        <FontAwesomeIcon icon="fa-brands fa-google"></FontAwesomeIcon>
                    </VIcon>
                </VBtn>
            </GoogleLogin>
        </VCol>
    </VRow>
</template>
<script lang="ts">
    import { useUserStore } from '../plugins/stores/userStore';
    import { defineComponent, ref } from 'vue';
    export default defineComponent({
        data() {
            return {
                loading: false,
                error: false,
            };
        },
        methods: {
            callback(response: any) {
                console.log(response);
                axios
                    .post('/user/auth/oauth2-login', response)
                    .then((response) => {
                        console.log(response);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
        },
    });
</script>
<style>
    iframe {
        width: 224px !important;
        height: 40px !important;
        margin: 0px !important;
    }
    .haAclf {
        padding: 0 !important;
    }
</style>
