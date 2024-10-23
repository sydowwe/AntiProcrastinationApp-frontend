<script setup lang="ts">
import {defineEmits} from 'vue';

const props = defineProps({
	title: String,
	hasFooter: {type: Boolean, default: true},
})
const emit = defineEmits<{
	(e: 'cancel'): void;
	(e: 'confirm'): void;
}>();
</script>

<template>
<VCard class="mt-5">
	<VCardTitle v-if="title" class="mb-4">{{ title }}</VCardTitle>
	<VCardText class="pb-0">
		<slot></slot>
	</VCardText>
	<VCardActions v-if="hasFooter" class="d-flex justify-end mx-2 mb-2">
		<VBtn color="error" @click="emit('cancel')">
			{{ $t('general.cancel') }}
		</VBtn>
		<VBtn color="success" @click="emit('confirm')">
			{{ $t('general.save') }}
		</VBtn>
	</VCardActions>
</VCard>
</template>

<style scoped>

</style>