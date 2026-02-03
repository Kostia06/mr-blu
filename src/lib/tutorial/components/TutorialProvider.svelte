<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tutorialStore } from '../store.svelte';
	import TutorialStartModal from './TutorialStartModal.svelte';
	import TutorialOverlay from './TutorialOverlay.svelte';
	import TutorialCompleteModal from './TutorialCompleteModal.svelte';
	import HintTooltip from './HintTooltip.svelte';

	// Initialize tutorial on mount
	onMount(() => {
		// Small delay to let the page fully render
		const timer = setTimeout(() => {
			tutorialStore.initialize();
		}, 500);

		return () => clearTimeout(timer);
	});

	// Check if user is on dashboard (required for tutorial)
	const isOnDashboard = $derived($page.url.pathname.startsWith('/dashboard'));
</script>

<!-- Only show tutorial components when on dashboard -->
{#if isOnDashboard}
	<TutorialStartModal />
	<TutorialOverlay />
	<TutorialCompleteModal />
	<HintTooltip />
{/if}
