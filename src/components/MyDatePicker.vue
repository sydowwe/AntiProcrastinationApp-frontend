<template>
<div class="d-flex align-center">
	<VBtn
		variant="flat"
		icon
		@click="quickChangeDate(-1)"
		style="border-radius: 3px"
		v-if="showArrows"
	>
		<VIcon icon="chevron-left" size="x-large" class="clickableIcon"></VIcon>
	</VBtn>
	<VTextField
		label="Date"
		v-model="dateNice"
		clearable
		@click:clear="clearDate"
		persistent-clear
		readonly
		hide-details
		style="max-width: 150px;"
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
	<VBtn
		variant="flat"
		icon
		@click="quickChangeDate(1)"
		style="border-radius: 3px"
		v-if="showArrows"
	>
		<VIcon icon="chevron-right" size="x-large" class="clickableIcon"></VIcon>
	</VBtn>
</div>
</template>
<script setup lang="ts">
import {ref, computed} from "vue";
import {importDefaults} from '@/compositions/Defaults';

const {i18n} = importDefaults();
const props = defineProps({
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
	}
});
const dateValue = props.clearable ? ref<Date | null>(null) : ref(new Date());
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
	console.log(dateValue.value);
	console.log(dateNice.value);
}

const getDateISO = computed(() => {
	dateValue.value?.setUTCHours(0, 0, 0, 0);
	return dateValue.value?.toISOString();
});

function setDate(newDate: Date) {
	dateValue.value = newDate;
}

defineExpose({
	getDateISO,
	setDate
});
</script>
<style>
div.v-date-picker-month__day--hide-adjacent {
	display: none !important;
}

.v-date-picker .v-picker-title {
	display: none !important;
}

</style>