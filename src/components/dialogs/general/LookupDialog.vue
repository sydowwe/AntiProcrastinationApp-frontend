<template>
<MyDialog v-model="dialog" :title="(isEdit ? 'Upraviť ' : 'Pridať nový ') + entityNameNice"
          @closed="isEdit = false"
          @confirmed="onConfirmed">
	<VForm v-model="isValid" @submit.prevent="onConfirmed">
		<VTextField
			v-model="text"
			label="Text"
			:rules="[requiredRule]">
		</VTextField>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {LookupRequest, LookupResponse} from '@/classes/SelectOption.ts';
import {useGeneralRules} from '@/composable/RulesComposition.ts';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();
const {requiredRule, lettersWithDiacriticsAndSpecialCharsRule} = useGeneralRules();

const props = defineProps({
	entityName: {
		type: String,
		required: true,
	}
})

const entityNameNice = computed(() => i18n.t('servis.' + props.entityName).toLowerCase())
const dialog = ref(false);
const isValid = ref(false);

const text = ref('');
const isEdit = ref(false);
const editedId = ref<number | null>(null);

async function onConfirmed() {
	if (isValid.value) {
		const selectOption = new LookupRequest(text.value);

		console.log(selectOption)


		dialog.value = false;
		text.value = '';
	}
}

function openAddDialog() {
	dialog.value = true;
}

function openEditDialog(oldText: string, id: number){
	isEdit.value = true;
	text.value = oldText;
	editedId.value = id;
	dialog.value = true
}

const emit = defineEmits<{
	(e: 'created', newItem: LookupResponse): void;
	(e: 'updated', updatedId: number, updatedItem: LookupResponse): void;
}>()
defineExpose({openAddDialog, openEditDialog})
</script>