<template>
<VDialog v-model="fullScreenLoading" persistent fullscreen>
	<VCard color="transparent" flat class="d-flex justify-center align-center">
		<VProgressCircular indeterminate color="purple" :size="80" :width="13"></VProgressCircular>
	</VCard>
</VDialog>
</template>
<script setup lang="ts">
import {useLoading} from '@/composables/general/LoadingComposable.ts';

const {fullScreenLoading} = useLoading()
</script>
