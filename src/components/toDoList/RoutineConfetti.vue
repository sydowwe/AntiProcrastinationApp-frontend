<template>
	<Teleport to="body">
		<div
			class="confetti-container"
			aria-hidden="true"
		>
			<div
				v-for="(piece, i) in pieces"
				:key="i"
				class="confetti-piece"
				:style="piece"
			/>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'

	const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6']

	const pieces = ref<Record<string, string>[]>([])

	onMounted(() => {
		pieces.value = Array.from({ length: 48 }, () => {
			const x = 20 + Math.random() * 60
			const color = COLORS[Math.floor(Math.random() * COLORS.length)] as string
			const size = `${6 + Math.random() * 6}px`
			const duration = `${1.2 + Math.random() * 0.8}s`
			const delay = `${Math.random() * 0.35}s`
			const drift = `${(Math.random() - 0.5) * 140}px`
			const rotate = `${Math.random() > 0.5 ? 540 : -540}deg`
			return {
				'--x': `${x}vw`,
				'--drift': drift,
				'--color': color,
				'--size': size,
				'--duration': duration,
				'--delay': delay,
				'--rotate': rotate,
			}
		})
	})
</script>

<style scoped>
	.confetti-container {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 9999;
		overflow: hidden;
	}

	.confetti-piece {
		position: absolute;
		top: 65%;
		left: var(--x);
		width: var(--size);
		height: var(--size);
		background: var(--color);
		border-radius: 2px;
		animation: confetti-fly var(--duration) var(--delay) ease-out forwards;
	}

	@keyframes confetti-fly {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(-70vh) translateX(var(--drift)) rotate(var(--rotate));
			opacity: 0;
		}
	}
</style>
