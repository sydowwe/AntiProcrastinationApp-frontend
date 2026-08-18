<template>
	<SettingsSection :title="i18n.t('user.about')">
		<div class="d-flex justify-space-between align-center">
			<span class="text-medium-emphasis">{{ i18n.t('user.appVersion') }}</span>
			<VChip size="small">v{{ appVersion }}</VChip>
		</div>
		<div class="d-flex ga-3 flex-wrap">
			<RouterLink :to="{ name: LEGAL_ROUTE_NAMES.terms }">{{ i18n.t('user.termsOfService') }}</RouterLink>
			<RouterLink :to="{ name: LEGAL_ROUTE_NAMES.privacy }">{{ i18n.t('user.privacyPolicy') }}</RouterLink>
			<a :href="supportMailto">{{ i18n.t('user.contactSupport') }}</a>
		</div>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'
	import { LEGAL_ROUTE_NAMES } from '@/core/user/component/legal/legalDocuments.ts'
	import { useSupportContact } from '@/core/user/composable/useSupportContact.ts'

	const i18n = useI18n()
	const { buildMailto } = useSupportContact()
	const appVersion = import.meta.env.VITE_APP_VERSION

	const supportMailto = computed(() =>
		buildMailto(i18n.t('user.contactSupportSubject', { version: appVersion }), i18n.t('user.contactSupportBody')),
	)
</script>
