<template>
    <VDialog v-model="loading" persistent fullscreen>
        <VCard color="transparent" flat class="d-flex justify-center align-center">
            <VProgressCircular indeterminate color="purple" :size="80" :width="13"></VProgressCircular>
        </VCard>
    </VDialog>
</template>
<script setup lang="ts">
    import { useFullScreenLoadingStore } from '../../stores/globalFeedbackStores';
    import { storeToRefs } from 'pinia';
    const { loading } = storeToRefs(useFullScreenLoadingStore());
</script>
