<template>
    <VSnackbar v-model="snackbar" :timeout="timeout" color="error" location="top">
        {{ message }}
        <template v-if="closable" v-slot:actions>
            <v-btn color="white" variant="text" @click="hideErrorSnackbar"> {{ $t('general.close') }} </v-btn>
        </template>
    </VSnackbar>
</template>
<script setup lang="ts">
    import {useErrorSnackBar} from '../../compositions/ErrorSnackBarFunctions';
    const { snackbar, message, timeout, closable, hideErrorSnackbar } = useErrorSnackBar();
</script>
