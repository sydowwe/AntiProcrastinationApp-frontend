<template>
<div class="d-flex align-center">
	<VBtn
		variant="text"
		icon
		@click="quickChangeDate(-1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeDate(-1)"
	>
		<VIcon icon="chevron-left" size="large" class="clickableIcon"></VIcon>
	</VBtn>
	<VTextField
		:label="label ?? $t('dateTime.date')"
		v-model="dateNice"
		clearable
		@click:clear="clearDate"
		persistent-clear
		readonly
		hide-details
		style="min-width: 155px;"
	>
		<VMenu
			activator="parent"
			:close-on-content-click="false"
			v-model="showDatePicker"
			location="bottom center"
			style="width: fit-content !important">
			<VDatePicker
				v-model="dateValue"
				:max="maxDate?.toISOString()"
				:min="minDate?.toISOString()"
				title=""
			>
				<template v-slot:title style="padding: 0 !important">
				</template>
				<template v-slot:actions>
					<VBtn @click="today" color="primary" variant="elevated">{{ $t('dateTime.today') }}</VBtn>
					<VBtn v-if="clearable" @click="clearDate" color="error" variant="elevated">{{ $t('general.clear') }}</VBtn>
				</template>
			</VDatePicker>
		</VMenu>
	</VTextField>
	<VBtn
		variant="text"
		icon
		@click="quickChangeDate(1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeDate(1)"
	>
		<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
	</VBtn>
</div>
</template>
<script setup lang="ts">
import {ref, computed, defineModel} from "vue";
import {useMoment} from '@/compositions/general/MomentHelper'
import {useContinuousQuickChangeComposition} from '@/compositions/general/continuousQuickChangeComposition'

const { formatToDate } = useMoment();
const continuousQuickChangeDate = useContinuousQuickChangeComposition(quickChangeDate);

const props = defineProps({
	label:{
		type: String,
		default: null
	},
	clearable: {
		type: Boolean,
		default: true,
	},
	showArrows: {
		type: Boolean,
		default: true,
	},
	maxDate: {
		type: Date,
		default: null,
	},
	minDate: {
		type: Date,
		default: null,
	},
});
const dateValue = defineModel<Date | null>({required: true});
const showDatePicker = ref(false);

const dateNice = computed(() => {
	if (dateValue.value) {
		return formatToDate(dateValue.value);
	} else {
		return null;
	}
});
function clearDate() {
	dateValue.value = props.clearable ? null : new Date();
	showDatePicker.value = false;
}

function today() {
	dateValue.value = new Date();
	showDatePicker.value = false;
}

function quickChangeDate(increment: number) {
	showDatePicker.value = false;
	if (!dateValue.value) {
		dateValue.value = new Date();
		return;
	}
	if (increment > 0 && !props.maxDate ||
		increment < 0 && !props.minDate ||
		increment > 0 && dateValue.value.getDate() + increment <= props.maxDate.getDate() ||
		increment < 0 && dateValue.value.getDate() >= props.minDate.getDate()) {
		dateValue.value = new Date(dateValue.value.setDate(dateValue.value.getDate() + increment));
	}
}
</script>
<style>
div.v-date-picker-month__day--hide-adjacent {
	display: none !important;
}

.v-date-picker .v-picker-title {
	display: none !important;
}

</style>