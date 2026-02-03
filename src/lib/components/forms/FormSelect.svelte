<script lang="ts">
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		label: string;
		name: string;
		options: Option[];
		value?: string;
		placeholder?: string;
		error?: string;
		hint?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		onchange?: (value: string) => void;
	}

	let {
		label,
		name,
		options,
		value = $bindable(''),
		placeholder = 'Select an option',
		error,
		hint,
		disabled = false,
		required = false,
		class: className = '',
		onchange
	}: Props = $props();

	let focused = $state(false);

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		onchange?.(target.value);
	}
</script>

<div class="form-select-wrapper {className}" class:has-error={error} class:is-disabled={disabled}>
	<label for={name} class="form-label">
		{label}
		{#if required}
			<span class="required-mark">*</span>
		{/if}
	</label>

	<div class="select-container" class:focused class:has-error={error}>
		<select
			{name}
			id={name}
			{value}
			{disabled}
			{required}
			class="form-select"
			class:placeholder={!value}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			onchange={handleChange}
		>
			{#if placeholder}
				<option value="" disabled>{placeholder}</option>
			{/if}
			{#each options as option (option.value)}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>

		<span class="select-icon">
			<ChevronDown size={18} strokeWidth={2} />
		</span>

		{#if error}
			<span class="select-status error">
				<AlertCircle size={16} strokeWidth={2} />
			</span>
		{/if}
	</div>

	{#if error}
		<p id="{name}-error" class="form-error">{error}</p>
	{:else if hint}
		<p id="{name}-hint" class="form-hint">{hint}</p>
	{/if}
</div>

<style>
	.form-select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-select-wrapper.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	/* Label */
	.form-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-700, #334155);
	}

	.required-mark {
		color: var(--data-red, #ef4444);
		margin-left: 2px;
	}

	/* Select container */
	.select-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	/* Select */
	.form-select {
		width: 100%;
		padding: 16px 48px 16px 18px;
		font-size: 16px;
		color: var(--gray-900, #0f172a);
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-input, 12px);
		outline: none;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		transition: all 0.2s ease;
	}

	.form-select.placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.form-select:hover:not(:focus) {
		border-color: var(--gray-300, #cbd5e1);
	}

	.form-select:focus {
		border-color: var(--blu-primary, #0066ff);
		box-shadow: var(--shadow-input-focus, 0 0 0 3px rgba(0, 102, 255, 0.15));
	}

	.select-container.has-error .form-select {
		border-color: var(--data-red, #ef4444);
		padding-right: 72px;
	}

	.select-container.has-error .form-select:focus {
		box-shadow: var(--shadow-input-error, 0 0 0 3px rgba(239, 68, 68, 0.15));
	}

	/* Chevron icon */
	.select-icon {
		position: absolute;
		right: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		pointer-events: none;
		transition: all 0.2s ease;
	}

	.select-container.focused .select-icon {
		color: var(--blu-primary, #0066ff);
		transform: rotate(180deg);
	}

	.select-container.has-error .select-icon {
		right: 42px;
	}

	/* Status icon */
	.select-status {
		position: absolute;
		right: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.select-status.error {
		color: var(--data-red, #ef4444);
	}

	/* Hint & Error messages */
	.form-hint,
	.form-error {
		font-size: 13px;
		margin: 0;
	}

	.form-hint {
		color: var(--gray-500, #64748b);
	}

	.form-error {
		color: var(--data-red, #ef4444);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.form-select,
		.select-icon {
			transition: none;
		}
	}
</style>
