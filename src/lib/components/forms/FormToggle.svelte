<script lang="ts">
	interface Props {
		label: string;
		description?: string;
		name?: string;
		checked?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md';
		variant?: 'default' | 'card';
		class?: string;
		onchange?: (checked: boolean) => void;
	}

	let {
		label,
		description,
		name,
		checked = $bindable(false),
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange
	}: Props = $props();

	function handleChange() {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleChange();
		}
	}
</script>

<div
	class="form-toggle-wrapper {variant} {size === 'sm' ? 'toggle-sm' : ''} {className}"
	class:is-disabled={disabled}
>
	<button
		type="button"
		class="toggle-control"
		role="switch"
		aria-checked={checked}
		aria-label={label}
		{disabled}
		onclick={handleChange}
		onkeydown={handleKeydown}
	>
		<input type="checkbox" {name} bind:checked class="toggle-input" tabindex="-1" {disabled} />

		<span class="toggle-track" class:checked>
			<span class="toggle-thumb"></span>
		</span>
	</button>

	<div
		class="toggle-content"
		onclick={handleChange}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<span class="toggle-label">{label}</span>
		{#if description}
			<span class="toggle-description">{description}</span>
		{/if}
	</div>
</div>

<style>
	.form-toggle-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		cursor: pointer;
	}

	.form-toggle-wrapper.is-disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Card variant */
	.form-toggle-wrapper.card {
		flex-direction: row-reverse;
		justify-content: space-between;
		padding: 16px;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-button, 14px);
		transition: all 0.2s ease;
	}

	.form-toggle-wrapper.card:hover:not(.is-disabled) {
		border-color: var(--gray-300, #cbd5e1);
	}

	/* Toggle control */
	.toggle-control {
		position: relative;
		display: flex;
		align-items: center;
		padding: 0;
		background: none;
		border: none;
		cursor: inherit;
		flex-shrink: 0;
	}

	.toggle-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* Toggle track */
	.toggle-track {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 48px;
		height: 28px;
		background: var(--gray-200, #e2e8f0);
		border-radius: 100px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toggle-sm .toggle-track {
		width: 40px;
		height: 24px;
	}

	.toggle-track.checked {
		background: var(--blu-primary, #0066ff);
	}

	/* Toggle thumb */
	.toggle-thumb {
		position: absolute;
		left: 3px;
		width: 22px;
		height: 22px;
		background: var(--white, #dbe8f4);
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toggle-sm .toggle-thumb {
		width: 18px;
		height: 18px;
	}

	.toggle-track.checked .toggle-thumb {
		transform: translateX(20px);
	}

	.toggle-sm .toggle-track.checked .toggle-thumb {
		transform: translateX(16px);
	}

	/* Hover states */
	.toggle-control:hover .toggle-track:not(.checked) {
		background: var(--gray-300, #cbd5e1);
	}

	.toggle-control:hover .toggle-track.checked {
		background: var(--blu-primary-hover, #0052cc);
	}

	/* Focus states */
	.toggle-control:focus-visible .toggle-track {
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.2);
	}

	/* Content */
	.toggle-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.toggle-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
		line-height: 1.4;
	}

	.toggle-description {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		line-height: 1.4;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.toggle-track,
		.toggle-thumb,
		.form-toggle-wrapper.card {
			transition: none;
		}
	}
</style>
