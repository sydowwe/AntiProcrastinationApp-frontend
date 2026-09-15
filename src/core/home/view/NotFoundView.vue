<template>
	<VContainer class="d-flex justify-center py-12">
		<VAlert
			type="warning"
			variant="tonal"
			maxWidth="520"
			:title="$t('notFound.title')"
			:text="$t('notFound.text')"
		>
			<template #append>
				<VBtn
					variant="text"
					:to="{ name: 'home' }"
				>
					{{ $t('general.backHome') }}
				</VBtn>
			</template>
		</VAlert>
	</VContainer>
</template>

<script setup lang="ts">
	/**
	 * The catch-all route's view (`src/router.ts`, `/:pathMatch(.*)*`). Same shape as the two
	 * per-entity not-found states (`TodoListView`, `PlannerTaskLinkView`). Generic enough to belong
	 * to the framework — see `migration-revision.md` §14 for the upstream ask.
	 */
</script>
