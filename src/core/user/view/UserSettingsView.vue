<template>
	<!--
		Thin wrapper over the framework's settings view. The framework renders appearance, security
		and sessions; everything below is specific to this app and is passed in through its slots.
	-->
	<FrameworkUserSettingsView>
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
		</template>
	</FrameworkUserSettingsView>
</template>
<script setup lang="ts">
	import FrameworkUserSettingsView from '@/_common/modules/user/view/UserSettingsView.vue'
	import GoogleCalendarCard from '@/core/googleCalendar/component/GoogleCalendarCard.vue'
	import PreferencesSection from '@/core/user/component/settings/PreferencesSection.vue'
	import ModuleSettingsSection from '@/core/user/component/settings/ModuleSettingsSection.vue'
	import DataExportSection from '@/core/user/component/settings/DataExportSection.vue'
	import AboutSection from '@/core/user/component/settings/AboutSection.vue'
</script>
