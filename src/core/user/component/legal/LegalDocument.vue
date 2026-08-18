<template>
	<VContainer
		class="py-8"
		style="max-width: 800px"
	>
		<VCard class="pa-4 pa-sm-6">
			<!-- Deliberately not VCardTitle / VCardSubtitle: both are `white-space: nowrap` with an
			     ellipsis in Vuetify 3, which truncated the effective-version line on a phone. -->
			<h1 class="text-h5 mb-1">{{ i18n.t(`user.legal.${documentKey}.title`) }}</h1>
			<p class="text-caption text-medium-emphasis mb-6">
				{{ i18n.t('user.legal.lastUpdatedLabel') }}: {{ lastUpdated }} —
				{{ i18n.t('user.legal.effectiveNotice') }}
			</p>
			<section
				v-for="section in sections"
				:key="section.heading"
				class="mb-5"
			>
				<h2 class="text-subtitle-1 font-weight-bold mb-1">{{ section.heading }}</h2>
				<p
					class="text-body-2"
					style="white-space: pre-line"
				>
					{{ section.body }}
				</p>
			</section>
			<VDivider class="mb-4"></VDivider>
			<div class="d-flex ga-4 flex-wrap">
				<RouterLink :to="{ name: LEGAL_ROUTE_NAMES[otherDocumentKey] }">
					{{ i18n.t(`user.legal.${otherDocumentKey}.title`) }}
				</RouterLink>
				<a :href="buildMailto()">{{ i18n.t('user.contactSupport') }}</a>
			</div>
		</VCard>
	</VContainer>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { localeTag } from '@/i18n.ts'
	import {
		LEGAL_LAST_UPDATED,
		LEGAL_ROUTE_NAMES,
		type LegalDocumentKey,
	} from '@/core/user/component/legal/legalDocuments.ts'
	import { useSupportContact } from '@/core/user/composable/useSupportContact.ts'

	const { documentKey } = defineProps<{ documentKey: LegalDocumentKey }>()

	const i18n = useI18n()
	const { buildMailto } = useSupportContact()

	/**
	 * The copy is an array of `{ heading, body }` under `user.legal.<document>.sections`, so a
	 * whole document is one locale entry rather than forty flat keys. `tm` returns the
	 * raw message array (messages are compiled on demand, so the leaves are plain strings here) and
	 * reads the reactive locale, which is what re-renders the whole document on SK↔EN.
	 */
	const sections = computed(
		() => i18n.tm(`user.legal.${documentKey}.sections`) as { heading: string; body: string }[],
	)

	const otherDocumentKey = computed<LegalDocumentKey>(() => (documentKey === 'terms' ? 'privacy' : 'terms'))

	// `timeZone: 'UTC'` because the constant is a bare calendar day: `new Date('2026-08-18')` is UTC
	// midnight, and formatting it in a zone behind UTC would print the previous day.
	const lastUpdated = computed(() =>
		new Date(LEGAL_LAST_UPDATED[documentKey]).toLocaleDateString(localeTag(i18n.locale.value), {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		}),
	)
</script>
