<script lang="ts">
	import { page } from '$app/stores';
	import Mic from 'lucide-svelte/icons/mic';
	import FileText from 'lucide-svelte/icons/file-text';
	import Settings from 'lucide-svelte/icons/settings';
	import { t } from '$lib/i18n';
	import { pageTransition } from '$lib/stores/pageTransition';

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

<nav class="bottom-nav">
	<!-- Animated indicator -->
	<div class="indicator" style="transform: translateX({activeIndex * 72}px)"></div>

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

<style>
	.bottom-nav {
		position: fixed;
		bottom: var(--space-5);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-3);
		background: var(--glass-white-70);
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
		padding: var(--space-2);
		padding-bottom: calc(var(--space-2) + var(--safe-area-bottom));
		border-radius: var(--radius-full);
		box-shadow: var(--blu-shadow-md);
		z-index: var(--z-fixed);
		transition: transform var(--duration-normal) var(--ease-out-expo);
	}

	.indicator {
		position: absolute;
		left: var(--space-2);
		width: 60px;
		height: 60px;
		background: var(--glass-white-70);
		border-radius: var(--radius-full);
		transition: transform var(--duration-normal) var(--ease-out-expo);
		box-shadow: var(--blu-shadow-sm);
	}

	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		color: var(--gray-500);
		text-decoration: none;
		transition: color var(--duration-fast) ease;
		border-radius: var(--radius-full);
		z-index: 1;
	}

	.nav-item:hover {
		color: var(--gray-600);
	}

	.nav-item.active {
		color: var(--blu-primary);
	}

	.nav-item:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: 2px;
	}
</style>
