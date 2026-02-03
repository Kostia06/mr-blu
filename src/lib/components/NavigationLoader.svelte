<script lang="ts">
	import { navigating } from '$app/stores';

	let progress = $state(0);
	let visible = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if ($navigating) {
			visible = true;
			progress = 10;

			// Simulate progress
			intervalId = setInterval(() => {
				if (progress < 90) {
					progress += Math.random() * 15;
				}
			}, 100);
		} else {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			if (visible) {
				progress = 100;
				setTimeout(() => {
					visible = false;
					progress = 0;
				}, 200);
			}
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

{#if visible}
	<div class="nav-loader">
		<div class="nav-loader-bar" style="transform: scaleX({Math.min(progress, 100) / 100})"></div>
	</div>
{/if}

<style>
	.nav-loader {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: rgba(0, 102, 255, 0.1);
		z-index: 9999;
	}

	.nav-loader-bar {
		height: 100%;
		background: linear-gradient(90deg, #0066ff 0%, #0ea5e9 100%);
		width: 100%;
		transform-origin: left;
		transition: transform 0.1s ease-out;
	}
</style>
