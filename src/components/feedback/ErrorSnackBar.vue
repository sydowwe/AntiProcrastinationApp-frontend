<template>
    <VSnackbar v-model="snackbar" :timeout="timeout" color="error" location="top">
        {{ message }}
        <template v-if="closable" v-slot:actions>
            <v-btn color="white" variant="text" @click="hide"> {{ $t('general.close') }} </v-btn>
        </template>
    </VSnackbar>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    export default defineComponent({
        props: {            
            timeout: {
                type: Number,
                default: 5000,
                required: false,
            },
            closable:{
                type: Boolean,
                default: true,
                required: false,
            }
        },
        data() {
            return {
                snackbar: false,
                message: 'ERROR',
            };
        },
        methods: {
            show(message:string) {
                this.message = message ?? this.$t("error").toUpperCase();
                this.snackbar = true;
            },
            hide() {
                this.snackbar = false;
            },
        },
    });
</script>
