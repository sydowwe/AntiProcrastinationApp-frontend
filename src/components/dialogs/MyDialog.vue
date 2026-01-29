<template>
<VDialog v-model="dialog" :persistent="persistent" :eager="eager" :maxWidth>
	<VCard class="py-5 px-0" color="surface">
		<slot name="header">
			<VCardTitle class="mb-1 px-6" v-if="hasHeader">
				<div class="text-h5">
					{{ title }}
				</div>
			</VCardTitle>
		</slot>
		<VCardText class="py-0 overflow-y-auto">
			<slot>
				<span class="px-6 py-4 text-center">
					{{ text }}
				</span>
			</slot>
		</VCardText>
		<VCardActions v-if="hasFooter" class="d-flex ga-3 pb-1 justify-end pt-4 px-6">
			<slot name="footer">
				<slot name="leftButton">
					<VBtn v-if="hasCloseBtn" :color="closeBtnColor" @click="onCloseBtnClick" :variant="closeBtnVariant" type="button">
						{{ closeBtnText ?? i18n.t('general.cancel') }}
					</VBtn>
				</slot>
				<slot name="centerButton"></slot>
				<slot name="rightButton">
					<VBtn v-if="hasConfirmBtn" :color="confirmBtnColor ?? 'primary'" @click="emit('confirmed')" :disabled="confirmBtnDisabled" type="button">
						{{ confirmBtnLabel ?? i18n.t('general.confirm') }}
					</VBtn>
				</slot>
			</slot>
		</VCardActions>
	</VCard>
</VDialog>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {computed} from 'vue';
import {useDisplay} from 'vuetify/framework';

const {smAndDown, mdAndDown, lgAndDown, xlAndDown} = useDisplay()
const i18n = useI18n();

const props = defineProps({
	title: {
		type: String,
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
	closeBtnColor: {
		type: String,
		default: 'secondaryOutline'
	},
	closeBtnVariant: {
		type: String as () => 'text' | 'outlined' | 'tonal',
		default: 'outlined'
	},
	closeBtnText: String,
	hasConfirmBtn: {
		type: Boolean,
		default: true
	},
	confirmBtnLabel: String,
	confirmBtnColor: String,
	confirmBtnDisabled: Boolean,
	isSmall: {
		type: Boolean,
		default: true
	},
});

const dialog = defineModel<boolean>({required: true})
const emit = defineEmits(['closed', 'confirmed'])


const onCloseBtnClick = () => {
	dialog.value = false;
	emit('closed');
}

function open() {
	dialog.value = true;
}

const maxWidth = computed(() => {
	if (smAndDown.value) {
		return '90%'
	} else if (mdAndDown.value) {
		return '70%'
	} else if (lgAndDown.value) {
		return props.isSmall ? '45%' : '70%'
	} else {
		return props.isSmall ? '30%' : '50%'
	}
})

defineExpose({
	open
})
</script>