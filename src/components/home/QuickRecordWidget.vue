<template>
	<VCard style="height: 450px; display: flex; flex-direction: column">
		<VCardTitle
			class="d-flex align-center px-4 pt-4 pb-2"
			style="height: 64px"
		>
			<span class="text-h6">
				{{ $t('home.quickRecord') }}
			</span>
		</VCardTitle>
		<VDivider />
		<VCardText
			class="pa-5 d-flex align-center justify-center"
			style="flex: 1"
		>
			<VRow>
				<VCol cols="6">
					<VBtn
						block
						variant="tonal"
						height="110"
						color="primaryOutline"
						prependIcon="fas fa-circle-half-stroke"
						class="d-flex flex-column"
						style="font-size: 14px"
						@click="router.push({ name: 'pomodoroTimer' })"
					>
						{{ $t('home.pomodoro') }}
					</VBtn>
				</VCol>
				<VCol cols="6">
					<VBtn
						block
						variant="tonal"
						height="110"
						color="primaryOutline"
						prependIcon="fas fa-hourglass-half"
						class="d-flex flex-column"
						style="font-size: 14px"
						@click="router.push({ name: 'timer' })"
					>
						{{ $t('home.timer') }}
					</VBtn>
				</VCol>
				<VCol cols="6">
					<VBtn
						block
						variant="tonal"
						height="110"
						color="secondaryOutline"
						prependIcon="fas fa-stopwatch"
						class="d-flex flex-column"
						style="font-size: 14px"
						@click="router.push({ name: 'stopwatch' })"
					>
						{{ $t('home.stopwatch') }}
					</VBtn>
				</VCol>
				<VCol cols="6">
					<VBtn
						block
						variant="tonal"
						height="110"
						color="secondaryOutline"
						prependIcon="fas fa-pen"
						class="d-flex flex-column"
						style="font-size: 14px"
						@click="router.push({ name: 'activityHistoryManual' })"
					>
						{{ $t('home.manual') }}
					</VBtn>
				</VCol>
			</VRow>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { useRouter } from 'vue-router'

	const router = useRouter()
</script>
