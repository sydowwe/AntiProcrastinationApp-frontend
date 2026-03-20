<template>
<div class="d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
	<NullFalseTrueCheckbox v-model="mappingFilter.isActive" label="Is active" hideDetails />
	<VSelect
		label="Type"
		v-model="mappingFilter.type"
		:items="TrackerDesktopMappingTypeOptions"
		density="compact"
		hideDetails
		maxWidth="150"
	/>
	<NullFalseTrueCheckbox v-if="mappingFilter.type === 'Ignored'" v-model="mappingFilter.isIgnored" label="Is ignored" hideDetails />
	<ActivitySelectionForm
		v-else-if="mappingFilter.type === 'Activity'"
		class="flex-fill"
		:showFromToDoListField="false"
		:isInRow="true"
		v-model="formData"
		isFilter
	/>
</div>
</template>

<script setup lang="ts">
import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {TrackerDesktopMappingsFilter} from '@/dtos/request/activityTracking/desktop/settings/TrackerDesktopMappingsFilter.ts';
import {TrackerDesktopMappingTypeOptions} from '@/dtos/enum/TrackerDesktopMappingTypeEnum.ts';
import {ActivityFormRequest} from '@/dtos/request/activity/ActivityFormRequest.ts';

const mappingFilter = defineModel<TrackerDesktopMappingsFilter>({required: true});
const formData = defineModel<ActivityFormRequest>('formData', {required: true});
</script>
