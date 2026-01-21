<template>
<div class="d-flex flex-column align-center">
	<VBtn @click="alarmDialog?.openCreate" color="success">
		{{ i18n.t("general.add") }}
	</VBtn>
	<VList class="d-flex flex-column pa-0 ga-2 mb-4" density="compact" title="To do list" lines="three" select-strategy="classic"
	       variant="tonal">
		<AlarmItem
			v-for="alarm in alarmList"
			@delete="deleteAlarm"
			@edit="alarmDialog?.openEdit"
			@select="select"
			@unSelect="unSelect"
			@isActiveChanged="handleIsActiveChanged" :alarm="alarm"></AlarmItem>
	</VList>
</div>

<AlarmDialog ref="alarmDialog" @add="add" @edit="edit"></AlarmDialog>
</template>
<script setup lang="ts">
import AlarmItem from '@/components/addActivityToHistory/AlarmItem.vue';
import AlarmDialog from '@/components/addActivityToHistory/AlarmDialog.vue';
import {onMounted, ref} from "vue";
import {Alarm} from "@/dtos/response/Alarm";
import {AlarmRequest} from "@/dtos/request/AlarmRequest";
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {useAlarmCrud} from '@/composables/ConcretesCrudComposable.ts';

const alarmDialog = ref<InstanceType<typeof AlarmDialog>>();
const i18n = useI18n();
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const alarmList = ref([] as Alarm[]);

const {createWithResponse, updateWithResponse, deleteEntity} = useAlarmCrud()

const url = "alarm";
onMounted(() => {
	getAll();
})

function getAll() {
	API.post(`/${url}/get-all`)
		.then((response) => {
			alarmList.value = Alarm.listFromObjects(response.data);
		}).catch(error => {
		console.log(error)
	});
}

const handleIsActiveChanged = (Alarm: Alarm) => {
	console.log(selectedItemsIds.value, Alarm);
	const isBatchAction = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(Alarm.id);
	const changedItemsIds = isBatchAction ? selectedItemsIds.value.map((item: number) => ({id: item})) : [{id: Alarm.id}];
	API.patch(`/${url}/change-active`, changedItemsIds)
		.then((response) => {
			console.log(response);
			if (isBatchAction) {
				alarmList.value.forEach((item) => {
					if (selectedItemsIds.value.includes(item.id) && item.id !== Alarm.id) {
						item.isActive = !item.isActive;
					}
				});
				selectedItemsIds.value = [];
			}
		})
		.catch((error) => {
			console.error(error);
		});
};


const add = (alarm: AlarmRequest) => {
	createWithResponse(alarm).then((response) => {
		alarmList.value.push(response);
		alarmList.value.sort(Alarm.frontEndSortFunction());
		showSuccessSnackbar(i18n.t("successFeedback.added"))
	});
};


const edit = (id: number, alarm: AlarmRequest) => {
	updateWithResponse(id, alarm).then((response) => {
		alarmList.value[alarmList.value.findIndex((item) => item.id === id)] = response;
		alarmList.value.sort(Alarm.frontEndSortFunction());
		showSuccessSnackbar(i18n.t("successFeedback.edited"))
	});

};


function deleteAlarm(id: number) {
	if (selectedItemsIds.value.length > 1) {
		const batchDeleteIds = selectedItemsIds.value.map((item: number) => ({
			id: item,
		}));
		API.post(`/${url}/batch-delete`, batchDeleteIds)
			.then((response) => {
				console.log(response.data);
				if (response.data.status === "success") {
					alarmList.value = alarmList.value.filter(
						(item: Alarm) => !selectedItemsIds.value.includes(item.id)
					);
					selectedItemsIds.value = [];
				}
			})
			.catch((error) => {
				console.error(error);
			});
	} else {
		deleteEntity(id)
			.then((response) => {
				alarmList.value = alarmList.value.filter(
					(item: Alarm) => item.id !== id
				);
			})
	}
}

const selectedItemsIds = ref([] as number[]);

function select(id: number) {
	if (!selectedItemsIds.value.includes(id)) {
		selectedItemsIds.value.push(id);
	}
}

function unSelect(id: number) {
	selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
}
</script>
<style scoped>

</style>