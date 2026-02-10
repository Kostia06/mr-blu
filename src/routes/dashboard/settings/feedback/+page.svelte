<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Send from 'lucide-svelte/icons/send';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import { t } from '$lib/i18n';

	type Category = 'bug' | 'feature' | 'general' | 'praise';

	const MAX_CHARS = 2000;
	const categories: Category[] = ['bug', 'feature', 'general', 'praise'];

	let comment = $state('');
	let category = $state<Category>('general');
	let isSending = $state(false);
	let isSubmitted = $state(false);

	let translate = $state((key: string) => key);
	$effect(() => {
		const unsub = t.subscribe((v) => (translate = v));
		return unsub;
	});

	const charCount = $derived(comment.length);
	const isOverLimit = $derived(charCount > MAX_CHARS);
	const canSubmit = $derived(comment.trim().length > 0 && !isOverLimit && !isSending);

	async function handleSubmit() {
		if (!canSubmit) return;

		isSending = true;
		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					comment: comment.trim(),
					category,
					pageContext: '/dashboard/settings/feedback'
				})
			});

			if (response.ok) {
				isSubmitted = true;
			}
		} finally {
			isSending = false;
		}
	}
</script>

{#if isSubmitted}
	<main class="feedback-page">
		<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
			<button
				class="back-btn"
				onclick={() => goto('/dashboard/settings')}
				aria-label={translate('common.backToSettings')}
			>
				<ChevronLeft size={22} strokeWidth={2} />
			</button>
			<h1 class="page-title">{translate('feedback.title')}</h1>
			<div class="header-spacer"></div>
		</header>

		<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
			<div class="success-state">
				<div class="success-icon">
					<CheckCircle size={48} strokeWidth={1.5} />
				</div>
				<p class="success-text">{translate('feedback.thanks')}</p>
			</div>
		</div>
	</main>
{:else}
	<main class="feedback-page">
		<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
			<button
				class="back-btn"
				onclick={() => goto('/dashboard/settings')}
				aria-label={translate('common.backToSettings')}
			>
				<ChevronLeft size={22} strokeWidth={2} />
			</button>
			<h1 class="page-title">{translate('feedback.title')}</h1>
			<div class="header-spacer"></div>
		</header>

		<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
			<!-- Category Selector -->
			<div class="category-selector">
				{#each categories as cat (cat)}
					<button
						class="category-pill"
						class:selected={category === cat}
						onclick={() => (category = cat)}
						aria-pressed={category === cat}
					>
						{translate(`feedback.${cat}`)}
					</button>
				{/each}
			</div>

			<!-- Textarea -->
			<div class="textarea-wrapper">
				<textarea
					class="feedback-textarea"
					class:over-limit={isOverLimit}
					bind:value={comment}
					placeholder={translate('feedback.placeholder')}
					rows={6}
					maxlength={MAX_CHARS}
				></textarea>
				<div class="char-count" class:over-limit={isOverLimit}>
					{charCount}/{MAX_CHARS}
				</div>
			</div>

			<!-- Submit Button -->
			<button
				class="submit-btn"
				onclick={handleSubmit}
				disabled={!canSubmit}
			>
				{#if isSending}
					<span class="btn-text">{translate('feedback.sending')}</span>
				{:else}
					<Send size={18} strokeWidth={2} />
					<span class="btn-text">{translate('feedback.submit')}</span>
				{/if}
			</button>
		</div>
	</main>
{/if}

<style>
	.feedback-page {
		min-height: 100vh;
		background: transparent;
	}

	/* Header */
	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--page-padding-x);
		padding-top: calc(var(--space-3) + var(--safe-area-top, 0px));
		background: transparent;
	}

	.back-btn {
		width: var(--btn-height-md);
		height: var(--btn-height-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-button);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.back-btn:hover {
		background: var(--glass-white-70);
		color: var(--gray-900);
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

	/* Page Content */
	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--section-gap, 24px);
		min-height: calc(100vh - 80px);
		padding-bottom: 100px;
	}

	/* Category Selector */
	.category-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.category-pill {
		padding: 8px 18px;
		background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid var(--glass-white-30, rgba(255, 255, 255, 0.3));
		border-radius: 100px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all var(--duration-fast, 150ms) ease;
	}

	.category-pill:hover {
		background: var(--glass-white-70);
		color: var(--gray-900);
	}

	.category-pill:active {
		transform: scale(0.96);
	}

	.category-pill.selected {
		background: var(--blu-primary, #0066ff);
		border-color: var(--blu-primary, #0066ff);
		color: white;
	}

	/* Textarea */
	.textarea-wrapper {
		position: relative;
	}

	.feedback-textarea {
		width: 100%;
		min-height: 160px;
		padding: 16px;
		background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30, rgba(255, 255, 255, 0.3));
		border-radius: var(--radius-input, 12px);
		font-family: inherit;
		font-size: 15px;
		line-height: 1.6;
		color: var(--gray-900, #0f172a);
		resize: vertical;
		transition: border-color var(--duration-fast, 150ms) ease;
		box-sizing: border-box;
	}

	.feedback-textarea::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.feedback-textarea:focus {
		outline: none;
		border-color: var(--blu-primary, #0066ff);
	}

	.feedback-textarea.over-limit {
		border-color: var(--red-500, #ef4444);
	}

	.char-count {
		position: absolute;
		bottom: 12px;
		right: 14px;
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
		pointer-events: none;
	}

	.char-count.over-limit {
		color: var(--red-500, #ef4444);
	}

	/* Submit Button */
	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 14px 24px;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-button, 14px);
		font-size: 15px;
		font-weight: 600;
		color: white;
		cursor: pointer;
		transition: all var(--duration-fast, 150ms) ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--blu-primary-hover, #0052cc);
		transform: translateY(-1px);
	}

	.submit-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Success State */
	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 64px 24px;
		text-align: center;
	}

	.success-icon {
		width: 88px;
		height: 88px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.08);
		border-radius: 50%;
		color: var(--blu-primary, #0066ff);
		margin-bottom: 20px;
	}

	.success-text {
		font-size: 16px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		margin: 0;
		line-height: 1.5;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.category-pill,
		.submit-btn,
		.feedback-textarea {
			transition: none;
		}
	}
</style>
