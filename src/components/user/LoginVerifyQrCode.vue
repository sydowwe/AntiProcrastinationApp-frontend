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
				Nesprávny kód
			</div>
			<h5 class="text-center">{{ $t('authorization.code2FA') }}</h5>
		</div>
	</MyDialog>
</template>
<script setup lang="ts">
	import { ref } from 'vue'

	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { API } from '@/plugins/axiosConfig.ts'
	import router from '@/plugins/router.ts'
	import { useUserStore } from '@/stores/userStore.ts'
	import { VOtpInput } from 'vuetify/components'

	const props = defineProps<{
		stayLoggedIn: boolean
		email: string
	}>()
	const dialog = defineModel<boolean>({ required: true })
	const i18n = useI18n()
	const userStore = useUserStore()

	const otpInput = ref<InstanceType<typeof VOtpInput>>()

	const token = ref('')
	const loading = ref(false)
	const error = ref(false)

	function submit() {
		loading.value = true
		API.post('/auth/login/2fa', {
			stayLoggedIn: props.stayLoggedIn,
			token: token.value,
			email: props.email,
		})
			.then(async response => {
				console.log(response)
				userStore.login(props.email)
				await router.push('/')
			})
			.catch(_error => {
				console.log(_error)
				error.value = true
				token.value = ''
				otpInput.value?.focus()
			})
			.finally(() => {
				loading.value = false
			})
	}
</script>
