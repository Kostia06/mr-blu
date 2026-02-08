<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let {
		words: wordsProp
	}: {
		words?: { text: string; highlight?: boolean }[];
	} = $props();

	// Reactive: use prop if provided, otherwise derive from translations
	const words = $derived(
		wordsProp ?? [
			{ text: $t('landing.hero.word1') },
			{ text: $t('landing.hero.word2'), highlight: true },
			{ text: $t('landing.hero.word3') }
		]
	);

	const subheadline = $derived($t('landing.hero.subheadline'));

	let visible = $state(false);

	onMount(() => {
		// Small delay before starting animation
		requestAnimationFrame(() => {
			visible = true;
		});
	});
</script>

<div class="hero-headline-container" class:visible>
	<h1 class="hero-headline">
		{#each words as word, wordIndex (word.text)}
			<span class="word" class:highlight={word.highlight} style="--word-index: {wordIndex}">
				{word.text}
			</span>
			{#if wordIndex < words.length - 1}
				<span class="word-space">&nbsp;</span>
			{/if}
		{/each}
	</h1>

	<p class="hero-subheadline">
		{subheadline}
	</p>
</div>

<style>
	.hero-headline-container {
		text-align: center;
		position: relative;
	}

	.hero-headline {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.03em;
		color: var(--gray-900, #0f172a);
		margin: 0 0 24px 0;
	}

	.word {
		display: inline-block;
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: calc(0.1s + var(--word-index) * 0.12s);
	}

	.visible .word {
		opacity: 1;
		transform: translateY(0);
	}

	.word.highlight {
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 50%, #6366f1 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.word-space {
		display: inline;
	}

	.hero-subheadline {
		font-family: var(--font-body);
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		font-weight: 400;
		line-height: 1.6;
		color: var(--gray-600, #475569);
		max-width: 540px;
		margin: 0 auto;
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: 0.5s;
	}

	.visible .hero-subheadline {
		opacity: 1;
		transform: translateY(0);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.word,
		.hero-subheadline {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.hero-headline {
			margin-bottom: 20px;
		}

		.hero-subheadline {
			padding: 0 16px;
		}
	}
</style>
