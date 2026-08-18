<template>
	<SettingsSection :title="i18n.t('user.exportData')">
		<p class="text-medium-emphasis text-body-2 ma-0">{{ i18n.t('user.exportDataDescription') }}</p>
		<VBtn
			color="primary"
			prependIcon="download"
			@click="runExport"
		>
			{{ i18n.t('user.exportData') }}
		</VBtn>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { useDataExport } from '@/core/user/composable/useDataExport.ts'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const { runExport } = useDataExport()
</script>
