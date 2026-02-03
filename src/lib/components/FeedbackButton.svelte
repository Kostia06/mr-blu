<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import X from 'lucide-svelte/icons/x';
	import Send from 'lucide-svelte/icons/send';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	let open = $state(false);
	let comment = $state('');
	let category = $state<'bug' | 'feature' | 'general' | 'praise'>('general');
	let submitting = $state(false);
	let success = $state(false);

	let charCount = $derived(comment.length);
	let canSubmit = $derived(comment.trim().length > 0 && !submitting);

	const categories = [
		{ value: 'bug', key: 'feedback.bug' },
		{ value: 'feature', key: 'feedback.feature' },
		{ value: 'general', key: 'feedback.general' },
		{ value: 'praise', key: 'feedback.praise' }
	] as const;

	function reset() {
		comment = '';
		category = 'general';
		submitting = false;
		success = false;
	}

	function close() {
		open = false;
		reset();
	}

	async function submit() {
		if (!canSubmit) return;
		submitting = true;
		try {
			await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					comment: comment.trim(),
					category,
					pageContext: $page.url.pathname
				})
			});
			success = true;
			setTimeout(() => {
				close();
			}, 1500);
		} catch {
			submitting = false;
		}
	}
</script>

<!-- Floating button -->
<button class="fab" onclick={() => (open = true)} aria-label="Send feedback">
	<MessageCircle size={22} />
</button>

<!-- Modal -->
{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" onkeydown={(e) => e.key === 'Escape' && close()} onclick={close}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			{#if success}
				<div class="success">
					<CheckCircle size={48} color="#0066FF" />
					<p>{$t('feedback.thanks')}</p>
				</div>
			{:else}
				<div class="header">
					<h2>{$t('feedback.title')}</h2>
					<button class="close-btn" onclick={close} aria-label="Close">
						<X size={20} />
					</button>
				</div>

				<fieldset class="categories">
					{#each categories as cat (cat.value)}
						<label class:selected={category === cat.value}>
							<input type="radio" name="category" value={cat.value} bind:group={category} />
							{$t(cat.key)}
						</label>
					{/each}
				</fieldset>

				<div class="textarea-wrap">
					<textarea
						bind:value={comment}
						maxlength={2000}
						rows={5}
						placeholder={$t('feedback.placeholder')}
					></textarea>
					<span class="char-count">{charCount}/2000</span>
				</div>

				<button class="submit-btn" disabled={!canSubmit} onclick={submit}>
					{#if submitting}
						{$t('feedback.sending')}
					{:else}
						<Send size={16} />
						{$t('feedback.submit')}
					{/if}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.fab {
		position: fixed;
		bottom: 80px;
		right: 16px;
		z-index: 1000;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: #0066ff;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(0, 102, 255, 0.4);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.fab:hover {
		transform: scale(1.08);
		box-shadow: 0 6px 20px rgba(0, 102, 255, 0.5);
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1001;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	.modal {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 16px;
		padding: 24px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.15);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	.header h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		color: #1a1a2e;
	}
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		padding: 4px;
		border-radius: 8px;
	}
	.close-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		border: none;
		padding: 0;
		margin: 0 0 16px;
	}
	.categories label {
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 0.85rem;
		cursor: pointer;
		border: 1px solid #ddd;
		background: rgba(255, 255, 255, 0.6);
		transition: all 0.15s;
		color: #444;
	}
	.categories label.selected {
		border-color: #0066ff;
		background: rgba(0, 102, 255, 0.1);
		color: #0066ff;
		font-weight: 500;
	}
	.categories input {
		display: none;
	}

	.textarea-wrap {
		position: relative;
		margin-bottom: 16px;
	}
	textarea {
		width: 100%;
		border: 1px solid #ddd;
		border-radius: 12px;
		padding: 12px;
		font-size: 0.9rem;
		resize: vertical;
		background: rgba(255, 255, 255, 0.6);
		font-family: inherit;
		box-sizing: border-box;
	}
	textarea:focus {
		outline: none;
		border-color: #0066ff;
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}
	.char-count {
		position: absolute;
		bottom: 8px;
		right: 12px;
		font-size: 0.75rem;
		color: #999;
	}

	.submit-btn {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 12px;
		background: #0066ff;
		color: white;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: opacity 0.15s;
	}
	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.submit-btn:not(:disabled):hover {
		background: #0055dd;
	}

	.success {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px 0;
		text-align: center;
	}
	.success p {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 500;
		color: #1a1a2e;
	}
</style>
