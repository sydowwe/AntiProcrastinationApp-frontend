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
</template>
<script setup lang="ts">
import AlarmItem from '@/components/AlarmItem.vue';

const alarmDialog = ref<AlarmDialogType>({} as AlarmDialogType);

import {onMounted, ref} from "vue";
import {Alarm, AlarmRequest} from "@/classes/Alarm";
import {importDefaults} from "@/compositions/Defaults";
import {AlarmDialogType} from '@/classes/types/RefTypeInterfaces';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = importDefaults();
const alarmList = ref([] as Alarm[]);

const url = "alarm";
onMounted(() => {
	getAll();
})
function getAll() {
	window.axios.post(`/${url}/get-all`)
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
	window.axios
		.patch(`/${url}/change-active`, changedItemsIds)
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
	window.axios.post(`${url}/add`, Alarm).then((response) => {
		alarmList.value.push(Alarm.fromObject(response.data));
		alarmList.value.sort(Alarm.frontEndSortFunction());
		showSnackbar(i18n.t("successFeedback.added"), {
			timeout: 1500,
			color: "success",
		});
	});
};

// function quickEditedActivity(id: number, name: string, text: string) {
// 	const editedActivity = alarmList.value[alarmList.value.findIndex(item => item.id === id)];
// 	if (editedActivity) {
// 		editedActivity.activity.name = name;
// 		editedActivity.activity.text = text;
// 	}
// }

const edit = (id: number, alarm: AlarmRequest) => {
	window.axios.put(`${url}/${id}`, alarm).then((response) => {
		alarmList.value[
			alarmList.value.findIndex((item) => item.id === id)
			] = Alarm.fromObject(response.data);
		alarmList.value.sort(Alarm.frontEndSortFunction());
		showSnackbar(i18n.t("successFeedback.edited"), {
			timeout: 1500,
			color: "success",
		});
	});

};


function deleteAlarm(id: number) {
	if (selectedItemsIds.value.length > 1) {
		const batchDeleteIds = selectedItemsIds.value.map((item: number) => ({
			id: item,
		}));
		window.axios
			.post(`/${url}/batch-delete`, batchDeleteIds)
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
		window.axios
			.delete(`/${url}/${id}`)
			.then((response) => {
				console.log(response.data);
				alarmList.value = alarmList.value.filter(
					(item: Alarm) => item.id !== id
				);
			})
			.catch((error) => {
				console.error(error);
			});
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