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
		if (isActive(href)) return;
		pageTransition.navigate(href);
	}
</script>

{#if !$isRecordingMode && !$isModalOpen}
<nav class="bottom-nav" transition:fly={{ y: 100, duration: 300, easing: cubicOut }}>
	<a
		href="/dashboard/documents"
		class="nav-item"
		class:active={isActive('/dashboard/documents')}
		onclick={(e) => handleNavClick(e, '/dashboard/documents')}
		data-tutorial="nav-documents"
	>
		<span class="nav-icon">
			<FileText size={24} strokeWidth={1.5} />
		</span>
	</a>

	<a
		href="/dashboard"
		class="nav-item"
		class:active={isActive('/dashboard')}
		onclick={(e) => handleNavClick(e, '/dashboard')}
	>
		<span class="nav-icon">
			<Mic size={24} strokeWidth={1.5} />
		</span>
	</a>

	<a
		href="/dashboard/settings"
		class="nav-item"
		class:active={isActive('/dashboard/settings')}
		onclick={(e) => handleNavClick(e, '/dashboard/settings')}
		data-tutorial="nav-settings"
	>
		<span class="nav-icon">
			<Settings size={24} strokeWidth={1.5} />
		</span>
	</a>
</nav>
{/if}

<style>
	.bottom-nav {
		position: fixed;
		bottom: var(--space-5);
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - var(--space-8));
		max-width: 220px;
		display: flex;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-full);
		padding-bottom: var(--safe-area-bottom);
		box-shadow: 0 4px 24px rgba(0, 40, 100, 0.1);
		z-index: var(--z-fixed);
		overflow: hidden;
		transition: transform var(--duration-normal) var(--ease-out-expo);
	}

	.nav-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3-5) var(--space-2);
		color: var(--gray-500);
		text-decoration: none;
		transition: all var(--duration-fast) ease;
		position: relative;
	}

.nav-item:hover:not(.active) {
		background: var(--gray-50);
		color: var(--gray-700);
	}

	.nav-item:active:not(.active) {
		background: var(--gray-100);
	}

	.nav-item.active {
		color: var(--blu-primary);
	}

	.nav-item:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: -2px;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--gray-100);
		border-radius: var(--radius-input);
		flex-shrink: 0;
		transition: all var(--duration-fast) ease;
	}

	.nav-item.active .nav-icon {
		background: var(--glass-primary-10);
		color: var(--blu-primary);
	}

/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.nav-item,
		.nav-icon {
			transition: none;
		}
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.nav-item {
			min-height: 44px;
		}
	}
</style>
