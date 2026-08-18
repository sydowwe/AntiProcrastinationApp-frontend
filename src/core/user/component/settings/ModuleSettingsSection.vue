<template>
	<SettingsSection :title="i18n.t('user.moduleSettings.title')">
		<p class="text-medium-emphasis text-body-2">{{ i18n.t('user.moduleSettings.description') }}</p>
		<VList
			class="pa-0"
			density="compact"
			bgColor="transparent"
		>
			<VListItem
				v-for="link in moduleSettingsLinks"
				:key="link.routeName"
				:prependIcon="link.icon"
				:title="i18n.t(`user.moduleSettings.${link.labelKey}`)"
				:to="{ name: link.routeName }"
				appendIcon="chevron-right"
				rounded="lg"
			/>
		</VList>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'
	import { moduleSettingsLinks } from '@/core/user/moduleSettingsLinks.ts'

	// Links out to the settings pages that other modules own, so `/user/settings` is the one place
	// every preference surface can be reached from. See `moduleSettingsLinks.ts` for why these are
	// route names rather than imports.
	const i18n = useI18n()
</script>
