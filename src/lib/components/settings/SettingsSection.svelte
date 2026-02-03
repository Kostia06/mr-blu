<script lang="ts">
	interface Props {
		title?: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { title, class: className = '', children }: Props = $props();
</script>

<section class="settings-section {className}">
	{#if title}
		<h2 class="section-title">{title}</h2>
	{/if}

	<div class="section-items">
		{#if children}
			{@render children()}
		{/if}
	</div>
</section>

<style>
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		padding: 0 4px;
		margin-bottom: 4px;
	}

	.section-items {
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-card, 20px);
		overflow: hidden;
	}
</style>
