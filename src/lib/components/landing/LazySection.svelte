<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	let { children, rootMargin = '200px' }: { children: Snippet; rootMargin?: string } = $props();

	let visible = $state(false);
	let container: HTMLDivElement;

	onMount(() => {
		if (!browser) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ rootMargin }
		);

		observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<div bind:this={container} class="lazy-section" class:loaded={visible}>
	{#if visible}
		{@render children()}
	{/if}
</div>

<style>
	.lazy-section:not(.loaded) {
		min-height: 60vh;
	}
</style>
