<script lang="ts">
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Mic from 'lucide-svelte/icons/mic';
	import FileText from 'lucide-svelte/icons/file-text';
	import Settings from 'lucide-svelte/icons/settings';
	import { t } from '$lib/i18n';
	import { pageTransition } from '$lib/stores/pageTransition';
	import { isRecordingMode, isModalOpen } from '$lib/stores/appState';

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		if (href === '/dashboard') {
			return pathname === '/dashboard';
		}
		return pathname.startsWith(href);
	};

	function handleNavClick(e: MouseEvent, href: string) {
		e.preventDefault();
		// Don't navigate if already on the page
		if (isActive(href)) return;
		pageTransition.navigate(href);
	}

	// Get active index for indicator position
	const activeIndex = $derived.by(() => {
		const pathname = $page.url.pathname;
		if (pathname === '/dashboard') return 1; // Record (center)
		if (pathname.startsWith('/dashboard/documents')) return 0; // Documents (left)
		if (pathname.startsWith('/dashboard/settings')) return 2; // Settings (right)
		return 1; // Default to center
	});
</script>

{#if !$isRecordingMode && !$isModalOpen}
<nav class="bottom-nav" transition:fly={{ y: 100, duration: 300, easing: cubicOut }}>
	<!-- Animated indicator -->
	<div class="indicator" style="transform: translateX({activeIndex * 58}px)"></div>

	<a
		href="/dashboard/documents"
		class="nav-item"
		class:active={isActive('/dashboard/documents')}
		onclick={(e) => handleNavClick(e, '/dashboard/documents')}
		aria-label={$t('nav.documents')}
		data-tutorial="nav-documents"
	>
		<FileText size={28} strokeWidth={isActive('/dashboard/documents') ? 2 : 1.5} />
	</a>

	<a
		href="/dashboard"
		class="nav-item"
		class:active={isActive('/dashboard')}
		onclick={(e) => handleNavClick(e, '/dashboard')}
		aria-label={$t('nav.record')}
	>
		<Mic size={28} strokeWidth={isActive('/dashboard') ? 2 : 1.5} />
	</a>

	<a
		href="/dashboard/settings"
		class="nav-item"
		class:active={isActive('/dashboard/settings')}
		onclick={(e) => handleNavClick(e, '/dashboard/settings')}
		aria-label={$t('nav.settings')}
		data-tutorial="nav-settings"
	>
		<Settings size={28} strokeWidth={isActive('/dashboard/settings') ? 2 : 1.5} />
	</a>
</nav>
{/if}

<style>
	.bottom-nav {
		position: fixed;
		bottom: var(--space-5);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		background: rgba(203, 218, 233, 0.65);
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
		padding: 6px;
		padding-bottom: calc(6px + var(--safe-area-bottom));
		border-radius: var(--radius-full);
		box-shadow: 0 4px 24px rgba(0, 40, 100, 0.1);
		z-index: var(--z-fixed);
		transition: transform var(--duration-normal) var(--ease-out-expo);
	}

	.indicator {
		position: absolute;
		left: 6px;
		width: 52px;
		height: 52px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: var(--radius-full);
		transition: transform var(--duration-normal) var(--ease-out-expo);
		box-shadow: 0 2px 8px rgba(0, 40, 100, 0.08);
	}

	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		color: var(--gray-500);
		text-decoration: none;
		transition: color var(--duration-fast) ease;
		border-radius: var(--radius-full);
		z-index: 1;
	}

	.nav-item:hover {
		color: var(--gray-700);
	}

	.nav-item.active {
		color: var(--blu-primary);
	}

	.nav-item:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: 2px;
	}
</style>
