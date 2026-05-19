<template>
	<div class="d-flex flex-column align-items-center">
		<span id="qrPrompt">{{ i18n.t('authorization.scan2FAQrCode') }}</span>
		<img
			:src="qrCodeImageUrl"
			alt="QR code for 2FA"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'

	const { qrCodeImage } = defineProps<{
		qrCodeImage: string
	}>()

	const i18n = useI18n()

	const qrCodeImageUrl = computed(() => `data:image/png;base64,${qrCodeImage}`)
</script>
