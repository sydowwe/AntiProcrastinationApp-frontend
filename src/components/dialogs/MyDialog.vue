<template>
<VDialog v-model="dialog" :persistent="persistent" :eager="eager">
	<VRow justify="center">
		<VCol cols="12" sm="10" md="8" lg="4">
			<VCard class="pa-1">
				<VCardTitle class="headline" v-if="hasHeader">
					<slot name="header">
						{{ title }}
					</slot>
				</VCardTitle>
				<VCardText class="py-0">
					<slot>
						<span class="text-center">
							{{ text }}
						</span>
					</slot>
				</VCardText>
				<VCardActions v-if="hasFooter" class="d-flex justify-center mx-2 mb-2">
					<slot name="footer">
						<slot name="leftButton">
							<VBtn v-if="hasCloseBtn" color="error" @click="onCloseBtnClick">
								{{ closeBtnText ?? i18n.t('general.cancel') }}
							</VBtn>
						</slot>
						<slot name="centerButton"></slot>
						<slot name="rightButton">
							<VBtn v-if="hasConfirmBtn" color="success" @click="emit('confirmed')">
								{{ confirmBtnLabel ?? i18n.t('general.confirm') }}
							</VBtn>
						</slot>
					</slot>
				</VCardActions>
			</VCard>
		</VCol>
	</VRow>
</VDialog>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';

const i18n = useI18n();

defineProps({
	title: {
		type: String,
		required: true,
	},
	text: String,
	persistent: {
		type: Boolean,
		default: true,
	},
	eager: {
		type: Boolean,
		default: false,
	},
	hasHeader: {
		type: Boolean,
		default: true,
	},
	hasFooter: {
		type: Boolean,
		default: true,
	},
	hasCloseBtn: {
		type: Boolean,
		default: true
	},
	closeBtnText: String,
	hasConfirmBtn: {
		type: Boolean,
		default: true
	},
	confirmBtnLabel: String,
});

const dialog = defineModel<boolean>({required: true})
const emit = defineEmits(['closed', 'confirmed'])

const onCloseBtnClick = () => {
	dialog.value = false;
	emit('closed');
}
</script>
