<template>
	<div class="mx-auto my-auto text-center">
		<div
			v-if="emailChangeConfirmed"
			class="text-center d-flex flex-column"
		>
			<div class="mb-3 text-success">{{ i18n.t('authorization.emailChangeConfirmed') }}</div>
			<VBtn
				color="main"
				@click="router.push('/login')"
			>
				{{ i18n.t('authorization.goToLogin') }}
			</VBtn>
		</div>
		<div
			v-if="emailChangeConfirmationError"
			class="text-center"
		>
			<VBtn
				color="error"
				@click="router.push('/login')"
			>
				{{ i18n.t('authorization.goToLogin') }}
			</VBtn>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { onMounted, ref } from 'vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import router from '@/plugins/router.ts'
	import { API } from '@/plugins/axiosConfig.ts'

	const i18n = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()

	const emailChangeConfirmed = ref(false)
	const emailChangeConfirmationError = ref(false)

	onMounted(() => {
		showFullScreenLoading()
		const query = router.currentRoute.value.query
		API.post('/user/change-email/confirm', {
			UserId: Number(query['userId']),
			NewEmail: query['email'],
			Token: query['token'],
		})
			.then(() => {
				emailChangeConfirmed.value = true
			})
			.catch(error => {
				showErrorSnackbar(i18n.t('authorization.errorConfirmingEmailChange'))
				emailChangeConfirmationError.value = true
				console.log(error)
			})
	})
</script>
