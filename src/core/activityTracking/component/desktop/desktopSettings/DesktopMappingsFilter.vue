<template>
	<div class="d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
		<NullFalseTrueCheckbox
			v-model="mappingFilter.isActive"
			label="Is active"
			hideDetails
		/>
		<VSelect
			v-model="mappingFilter.type"
			label="Type"
			:items="TrackerDesktopMappingTypeOptions"
			density="compact"
			hideDetails
			maxWidth="150"
		/>
		<NullFalseTrueCheckbox
			v-if="mappingFilter.type === 'Ignored'"
			v-model="mappingFilter.isIgnored"
			label="Is ignored"
			hideDetails
		/>
		<ActivitySelectionForm
			v-else-if="mappingFilter.type === 'Activity'"
			v-model="formData"
			class="flex-fill"
			:showFromToDoListField="false"
			isInRow
			isFilter
		/>
	</div>
</template>

<script setup lang="ts">
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import type { TrackerDesktopMappingsFilter } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingsFilter.ts'
	import { TrackerDesktopMappingTypeOptions } from '@/core/activityTracking/dto/enum/TrackerDesktopMappingTypeEnum.ts'
	import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'

	const mappingFilter = defineModel<TrackerDesktopMappingsFilter>({ required: true })
	const formData = defineModel<ActivityFormRequest>('formData', { required: true })
</script>
