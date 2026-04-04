<!-- TemplateDayPlannerView.vue -->
<template>
	<TemplatePlannerPanel :templateId="templateId" />
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRoute } from 'vue-router'
	import TemplatePlannerPanel from '@/components/dayPlanner/template/TemplatePlannerPanel.vue'

	const route = useRoute()
	const templateId = computed(() => (route.params.templateId ? parseInt(route.params.templateId as string) : null))
</script>
