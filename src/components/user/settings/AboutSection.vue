<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3>{{ i18n.t('user.about') }}</h3>
		<div class="d-flex justify-space-between align-center">
			<span class="text-medium-emphasis">{{ i18n.t('user.appVersion') }}</span>
			<VChip
				size="small"
				density="compact"
			>
				v{{ appVersion }}
			</VChip>
		</div>
		<div class="d-flex ga-3 flex-wrap">
			<a href="/legal/terms">{{ i18n.t('user.termsOfService') }}</a>
			<a href="/legal/privacy">{{ i18n.t('user.privacyPolicy') }}</a>
			<a href="mailto:support@antiprocrastinationapp.dev">{{ i18n.t('user.contactSupport') }}</a>
		</div>
	</VCard>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'

	const i18n = useI18n()
	const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0'
</script>
