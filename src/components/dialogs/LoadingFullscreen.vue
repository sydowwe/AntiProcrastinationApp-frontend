<template>
    <VDialog v-model="loading" persistent fullscreen>
        <VCard color="transparent" flat class="d-flex justify-center align-center">
            <VProgressCircular indeterminate color="purple" :size="80" :width="13"></VProgressCircular>
        </VCard>
    </VDialog>
</template>
<script setup lang="ts">
    import { useFullScreenLoading } from '../../compositions/FullScreenLoadingFunctions';
    const { loading } = useFullScreenLoading();
</script>
