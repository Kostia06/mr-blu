<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { t } from '$lib/i18n';

	interface Props {
		title?: string;
		onBack: () => void;
	}

	let { title, onBack }: Props = $props();
</script>

<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
	<button class="back-btn" onclick={onBack} aria-label={$t('review.back')}>
		<ChevronLeft size={22} strokeWidth={2} />
	</button>
	<h1 class="page-title">{title || $t('review.review')}</h1>
	<div class="header-spacer"></div>
</header>

<style>
	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky, 40);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3, 12px) var(--page-padding-x, 20px);
		padding-top: calc(var(--space-3, 12px) + env(safe-area-inset-top, 0px));
		background: transparent;
	}

	.back-btn {
		width: var(--btn-height-md, 40px);
		height: var(--btn-height-md, 40px);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: none;
		border-radius: var(--radius-button, 14px);
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.back-btn:hover {
		background: var(--glass-white-70, rgba(255, 255, 255, 0.7));
		color: var(--gray-900, #0f172a);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.page-title {
		font-family: var(--font-display, system-ui);
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.header-spacer {
		width: 40px;
	}
</style>
