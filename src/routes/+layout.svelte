<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { createClient } from '$lib/supabase/client';
	import { initSmoothScroll, destroySmoothScroll } from '$lib/utils/smoothScroll';
	import { initDeepLinks, destroyDeepLinks } from '$lib/utils/deepLink';
	import NavigationLoader from '$lib/components/NavigationLoader.svelte';
	let { children, data } = $props();

	// Initialize smooth scroll only on landing page
	$effect(() => {
		const unsubscribe = page.subscribe(($page) => {
			if ($page.url.pathname === '/') {
				initSmoothScroll();
			} else {
				destroySmoothScroll();
			}
		});
		return unsubscribe;
	});

	onMount(() => {
		// Hide the loading screen
		const loader = document.getElementById('app-loading');
		if (loader) {
			loader.classList.add('hidden');
			setTimeout(() => loader.remove(), 300);
		}

		const supabase = createClient();

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(() => {
			invalidate('supabase:auth');
		});

		// Initialize deep linking for native apps
		initDeepLinks();

		return () => {
			subscription.unsubscribe();
			destroySmoothScroll();
			destroyDeepLinks();
		};
	});
</script>

<svelte:head>
	<title>Mr.Blu - Voice to Documents</title>
	<meta name="description" content="Voice-to-document app for contractors" />
</svelte:head>

<NavigationLoader />

{@render children()}
