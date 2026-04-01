<template>
	<VDialog
		v-model="dialog"
		:persistent="persistent"
		:eager="eager"
		:maxWidth
		@keyup.enter="emit('confirmed')"
		@keyup.esc="onCloseBtnClick"
	>
		<VCard
			class="py-4 px-0"
			color="surface"
		>
			<slot name="header">
				<VCardTitle
					v-if="hasHeader"
					class="pt-1 px-6"
				>
					<slot name="title">
						<div class="text-h5">
							{{ title }}
						</div>
					</slot>
				</VCardTitle>
			</slot>
			<VCardText class="py-0 overflow-y-auto">
				<slot>
					<span class="px-6 py-4 text-center">
						{{ text }}
					</span>
				</slot>
			</VCardText>
			<VCardActions
				v-if="hasFooter"
				class="d-flex ga-3 pb-1 justify-end pt-3 px-6"
			>
				<slot name="footer">
					<slot name="leftButton">
						<VBtn
							v-if="hasCloseBtn"
							:color="closeBtnColor"
							:variant="closeBtnVariant"
							type="button"
							@click="onCloseBtnClick"
						>
							{{ closeBtnText ?? i18n.t('general.cancel') }}
						</VBtn>
					</slot>
					<slot name="centerButton"></slot>
					<slot name="rightButton">
						<VBtn
							v-if="hasConfirmBtn"
							:color="confirmBtnColor ?? 'primary'"
							:disabled="confirmBtnDisabled"
							type="button"
							@click="emit('confirmed')"
						>
							{{ confirmBtnLabel ?? i18n.t('general.confirm') }}
						</VBtn>
					</slot>
				</slot>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { computed } from 'vue'
	import { useDisplay } from 'vuetify/framework'

	const {
		title,
		text,
		persistent = true,
		eager = false,
		hasHeader = true,
		hasFooter = true,
		hasCloseBtn = true,
		closeBtnColor = 'secondaryOutline',
		closeBtnVariant = 'outlined',
		closeBtnText,
		hasConfirmBtn = true,
		confirmBtnLabel,
		confirmBtnColor,
		confirmBtnDisabled = false,
		isSmall = true,
	} = defineProps<{
		title?: string
		text?: string
		persistent?: boolean
		eager?: boolean
		hasHeader?: boolean
		hasFooter?: boolean
		hasCloseBtn?: boolean
		closeBtnColor?: string
		closeBtnVariant?: 'text' | 'outlined' | 'tonal'
		closeBtnText?: string
		hasConfirmBtn?: boolean
		confirmBtnLabel?: string
		confirmBtnColor?: string
		confirmBtnDisabled?: boolean
		isSmall?: boolean
	}>()
	const emit = defineEmits<{
		closed: []
		confirmed: []
	}>()
	const dialog = defineModel<boolean>({ required: true })
	const { smAndDown, mdAndDown, lgAndDown } = useDisplay()
	const i18n = useI18n()

	function onCloseBtnClick() {
		dialog.value = false
		emit('closed')
	}

	function open() {
		dialog.value = true
	}

	const maxWidth = computed(() => {
		if (smAndDown.value) {
			return '90%'
		} else if (mdAndDown.value) {
			return '70%'
		} else if (lgAndDown.value) {
			return isSmall ? '40%' : '70%'
		} else {
			return isSmall ? '30%' : '50%'
		}
	})

	defineExpose({
		open,
	})
</script>
