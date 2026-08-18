<template>
	<!--
		Thin wrapper over the framework's settings view. The framework renders appearance, security
		and sessions; everything below is specific to this app and is passed in through its slots.

		`deleteAccountWarning` is the text of the intent confirmation the framework now asks before
		the identity check on the delete path (F6 / R21). It duplicates, in one paragraph, what
		`DangerZoneSection` itemises on the page — deliberately, because the card can be scrolled
		past and the dialog cannot.
	-->
	<FrameworkUserSettingsView :deleteAccountWarning="i18n.t('user.dangerZone.deleteWarning')">
		<template #integrations>
			<GoogleCalendarCard />
		</template>
		<template #preferences>
			<PreferencesSection />
			<!-- Directly under the app's own preferences: the other pages that hold the rest of them.
			     See `moduleSettingsLinks.ts` — route names only, no cross-module imports. -->
			<ModuleSettingsSection />
		</template>
		<template #append>
			<DataExportSection />
			<AboutSection />
			<DangerZoneSection />
		</template>
	</FrameworkUserSettingsView>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import FrameworkUserSettingsView from '@/_common/modules/user/view/UserSettingsView.vue'
	import GoogleCalendarCard from '@/core/googleCalendar/component/GoogleCalendarCard.vue'
	import PreferencesSection from '@/core/user/component/settings/PreferencesSection.vue'
	import ModuleSettingsSection from '@/core/user/component/settings/ModuleSettingsSection.vue'
	import DataExportSection from '@/core/user/component/settings/DataExportSection.vue'
	import AboutSection from '@/core/user/component/settings/AboutSection.vue'
	import DangerZoneSection from '@/core/user/component/settings/DangerZoneSection.vue'

	const i18n = useI18n()
</script>
