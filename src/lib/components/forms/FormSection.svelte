<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		variant?: 'default' | 'card' | 'inline';
		class?: string;
		children?: import('svelte').Snippet;
	}

	let {
		title,
		description,
		variant = 'default',
		class: className = '',
		children
	}: Props = $props();
</script>

<section class="form-section {variant} {className}">
	{#if title || description}
		<div class="section-header">
			{#if title}
				<h3 class="section-title">{title}</h3>
			{/if}
			{#if description}
				<p class="section-description">{description}</p>
			{/if}
		</div>
	{/if}

	<div class="section-content">
		{#if children}
			{@render children()}
		{/if}
	</div>
</section>

<style>
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Card variant - glass/transparent background */
	.form-section.card {
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-card, 20px);
		padding: var(--card-padding, 20px);
	}

	/* Inline variant */
	.form-section.inline {
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
	}

	.form-section.inline .section-header {
		flex: 0 0 200px;
	}

	.form-section.inline .section-content {
		flex: 1;
	}

	@media (max-width: 640px) {
		.form-section.inline {
			flex-direction: column;
			gap: 16px;
		}

		.form-section.inline .section-header {
			flex: none;
		}
	}

	/* Header */
	.section-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.section-title {
		font-family: var(--font-display, system-ui);
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.section-description {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		margin: 0;
		line-height: 1.5;
	}

	/* Content */
	.section-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
