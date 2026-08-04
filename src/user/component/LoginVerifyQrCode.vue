<template>
	<MyDialog
		v-model="dialog"
		:title="i18n.t('authorization.twoFA')"
		:hasConfirmBtn="false"
	>
		<div>
			<VOtpInput
				ref="otpInput"
				v-model="token"
				class="pb-1"
				:label="$t('authorization.code')"
				autofocus
				:error
				:loading
				hideDetails
				@finish="submit"
				@input="error = false"
			></VOtpInput>
			<div
				v-if="error"
				class="text-center text-error text-caption mb-2"
			>
				{{ i18n.t('authorization.wrongCode') }}
			</div>
			<h5 class="text-center">{{ $t('authorization.code2FA') }}</h5>
		</div>
	</MyDialog>
</template>
<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { API } from '@/_common/axiosConfig.ts'
	import router from '@/router.ts'
	import { VOtpInput } from 'vuetify/components'
	import { useAuthStore } from '@/core/user/store/authStore.ts'

	const props = defineProps<{
		stayLoggedIn: boolean
		email: string
	}>()

	const dialog = defineModel<boolean>({ required: true })
	const i18n = useI18n()
	const authStore = useAuthStore()

	const otpInput = ref<InstanceType<typeof VOtpInput>>()

	const token = ref('')
	const loading = ref(false)
	const error = ref(false)

	async function submit() {
		loading.value = true
		try {
			await API.post('/auth/login/2fa', {
				stayLoggedIn: props.stayLoggedIn,
				token: token.value,
				email: props.email,
			})
			await authStore.authenticated()
			await router.push('/')
		} catch {
			error.value = true
			token.value = ''
			otpInput.value?.focus()
		} finally {
			loading.value = false
		}
	}
</script>
