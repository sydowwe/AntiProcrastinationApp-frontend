<template>
<div class="d-flex flex-column justify-md-end flex-md-row align-md-center ga-3 ga-md-4">
	<div v-if="mode === 'toActivity'" class="flex-fill">
		<ActivitySelectionForm :showFromToDoListField="false" :isInRow="true" v-model="formData" />
	</div>
	<VBtn color="error" @click="emit('clear')" prependIcon="broom" variant="tonal">Clear</VBtn>
	<VBtnToggle
		v-model="mode"
		mandatory
		density="compact"
		class="my-4"
		color="primaryOutline"
		variant="outlined"
		style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
	>
		<VBtn value="toActivity" height="40">To activity</VBtn>
		<VBtn value="toIgnored" height="40">To ignored</VBtn>
	</VBtnToggle>
	<VBtn color="secondary" prependIcon="check" @click="emit('save')">Save</VBtn>
</div>
</template>

<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {ActivityFormRequest} from '@/dtos/request/activity/ActivityFormRequest.ts';

const mode = defineModel<'toActivity' | 'toIgnored'>('mode');
const formData = defineModel<ActivityFormRequest>('formData');
const emit = defineEmits<{ clear: [], save: [] }>();
</script>
