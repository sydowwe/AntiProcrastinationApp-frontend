<template>
<VRow justify="center" align="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" xl="6" class="mt-3 mt-md-0">
		<AddActivityManuallyForm ref="formRef"></AddActivityManuallyForm>
		<div class="mt-8 w-100 text-center">
			<VBtn @click="handleSave" color="primary">{{ i18n.t('history.recordActivityToHistory') }}</VBtn>
		</div>
	</VCol>
</VRow>
</template>

<script setup lang="ts">
import AddActivityManuallyForm from '@/components/addActivityToHistory/AddActivityManuallyForm.vue';
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();
const formRef = ref<InstanceType<typeof AddActivityManuallyForm>>();

function handleSave() {
	formRef.value?.saveActivity();
}
</script>
