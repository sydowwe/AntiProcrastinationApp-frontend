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
	import DataExportSection from '@/core/user/component/settings/DataExportSection.vue'
	import AboutSection from '@/core/user/component/settings/AboutSection.vue'
</script>
