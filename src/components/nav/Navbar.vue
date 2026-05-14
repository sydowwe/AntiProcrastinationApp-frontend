<template>
	<header v-cloak>
		<nav>
			<NavbarDesktop v-if="!mdAndDown" />
			<NavbarMobile v-else />
		</nav>
	</header>
</template>

<script setup lang="ts">
	import { useDisplay, useTheme } from 'vuetify/framework'
	import { onMounted } from 'vue'
	import NavbarDesktop from '@/components/nav/NavbarDesktop.vue'
	import NavbarMobile from '@/components/nav/NavbarMobile.vue'

	const { mdAndDown } = useDisplay()

	const theme = useTheme()

	onMounted(() => {
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			theme.change(savedTheme)
		}
	})
</script>
