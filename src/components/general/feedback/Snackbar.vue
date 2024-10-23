<template>
    <VSnackbar class="mt-16" v-model="snackbar" :timeout="timeout" :color="color" location="top">
        {{ message }}
        <template v-if="closable" v-slot:actions>
            <v-btn color="white" variant="text" @click="hideSnackbar"> {{ $t('general.close') }} </v-btn>
        </template>
    </VSnackbar>
</template>
<script setup lang="ts">
    import { storeToRefs } from 'pinia';
    import { useSnackBarStore } from '../../../stores/globalFeedbackStores';
    const store = useSnackBarStore();
    const { snackbar, color, message, timeout, closable } = storeToRefs(store);
    const { hideSnackbar } = store;
</script>
