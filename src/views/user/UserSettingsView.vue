<template>
	<VRow
		justify="center"
		class="mt-16"
	>
		<VCol
			cols="12"
			sm="10"
			md="8"
			lg="6"
			class="d-flex flex-column ga-4"
		>
			<h2 class="text-center mb-2">{{ i18n.t('user.userSettings') }}</h2>
			<AppearanceSection />
			<SecuritySection />
			<PreferencesSection />
			<SessionsSection />
			<DataExportSection />
			<AboutSection />
		</VCol>
	</VRow>
</template>
<script setup lang="ts">
	import { onMounted } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/userStore.ts'
	import SecuritySection from '@/components/user/settings/SecuritySection.vue'
	import AppearanceSection from '@/components/user/settings/AppearanceSection.vue'
	import PreferencesSection from '@/components/user/settings/PreferencesSection.vue'
	import SessionsSection from '@/components/user/settings/SessionsSection.vue'
	import DataExportSection from '@/components/user/settings/DataExportSection.vue'
	import AboutSection from '@/components/user/settings/AboutSection.vue'

	const i18n = useI18n()
	const userStore = useUserStore()

	onMounted(() => userStore.hydrateFromServer())
</script>
