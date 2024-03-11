<template>
<div class="d-flex align-center pa-2" >
	<VTextField
		:label="label ?? i18n.t('dateTime.date')"
		v-model="dateNice"
		clearable
		@click:clear="clearDate"
		prepend-icon="chevron-left"
		@click:prepend="quickChangeDate(-1)"
		append-icon="chevron-right"
		@click:append="quickChangeDate(1)"
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
					<VBtn @click="today" color="primary" variant="elevated">{{ i18n.t('dateTime.today') }}</VBtn>
					<VBtn v-if="clearable" @click="clearDate" color="error" variant="elevated">{{ i18n.t('general.clear') }}</VBtn>
				</template>
			</VDatePicker>
		</VMenu>
	</VTextField>
</div>
</template>
<script setup lang="ts">
import {ref, computed, defineModel} from "vue";
import {importDefaults} from '@/compositions/Defaults';
import { useDate } from 'vuetify'
const adapter = useDate();
const {i18n} = importDefaults();
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
const dateValue = defineModel<Date | null>('dateValue');
const showDatePicker = ref(false);

const dateNice = computed(() => {
	if (dateValue.value) {
		return dateValue.value.toLocaleDateString();
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
		increment > 0 && dateValue.value.getDate() + increment < props.maxDate.getDate() ||
		increment < 0 && dateValue.value.getDate() > props.minDate.getDate()) {
		dateValue.value = new Date(dateValue.value.setDate(dateValue.value.getDate() + increment));
	}
}

// const getDateISO = computed(() => {
// 	dateValue.value?.setUTCHours(0, 0, 0, 1);
// 	return dateValue.value?.toISOString();
// });
// const getDate = computed(() => {
// 	dateValue.value?.setUTCHours(0, 0, 0, 1);
// 	return dateValue.value;
// });
// function setDate(newDate: Date) {
// 	dateValue.value = newDate;
// }
// defineExpose({
// 	getDateISO,
// 	getDate,
// 	setDate
// });
</script>
<style>
div.v-date-picker-month__day--hide-adjacent {
	display: none !important;
}

.v-date-picker .v-picker-title {
	display: none !important;
}

</style>