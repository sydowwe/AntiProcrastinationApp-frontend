<template>
	<SettingsSection :title="i18n.t('user.about')">
		<div class="d-flex justify-space-between align-center">
			<span class="text-medium-emphasis">{{ i18n.t('user.appVersion') }}</span>
			<VChip size="small">v{{ appVersion }}</VChip>
		</div>
		<div class="d-flex ga-3 flex-wrap">
			<a href="/legal/terms">{{ i18n.t('user.termsOfService') }}</a>
			<a href="/legal/privacy">{{ i18n.t('user.privacyPolicy') }}</a>
			<a :href="supportMailto">{{ i18n.t('user.contactSupport') }}</a>
		</div>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const appVersion = import.meta.env.VITE_APP_VERSION
	const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@antiprocrastinationapp.dev'

	const supportMailto = computed(() => {
		const subject = i18n.t('user.contactSupportSubject', { version: appVersion })
		const body = i18n.t('user.contactSupportBody')
		return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
	})
</script>
