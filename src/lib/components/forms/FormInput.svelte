<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Check from 'lucide-svelte/icons/check';

	interface Props {
		label: string;
		name: string;
		type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'date' | 'url';
		value?: string;
		placeholder?: string;
		error?: string;
		hint?: string;
		disabled?: boolean;
		required?: boolean;
		success?: boolean;
		variant?: 'default' | 'floating';
		icon?: import('svelte').Snippet;
		class?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
		onblur?: (e: Event) => void;
	}

	let {
		label,
		name,
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		error,
		hint,
		disabled = false,
		required = false,
		success = false,
		variant = 'default',
		icon,
		class: className = '',
		oninput,
		onchange,
		onblur
	}: Props = $props();

	let focused = $state(false);
	let hasValue = $derived(!!value);
	let showFloatingLabel = $derived(variant === 'floating' && (focused || hasValue));
</script>

<div
	class="form-input-wrapper {variant} {className}"
	class:has-error={error}
	class:is-disabled={disabled}
>
	{#if variant === 'default'}
		<label for={name} class="form-label">
			{label}
			{#if required}
				<span class="required-mark">*</span>
			{/if}
		</label>
	{/if}

	<div
		class="input-container"
		class:focused
		class:has-icon={icon}
		class:success
		class:has-error={error}
	>
		{#if icon}
			<span class="input-icon">
				{@render icon()}
			</span>
		{/if}

		<input
			{type}
			{name}
			id={name}
			bind:value
			placeholder={variant === 'floating' ? '' : placeholder}
			{disabled}
			{required}
			class="form-input"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
			onfocus={() => (focused = true)}
			onblur={(e) => {
				focused = false;
				onblur?.(e);
			}}
			{oninput}
			{onchange}
		/>

		{#if variant === 'floating'}
			<label for={name} class="floating-label" class:active={showFloatingLabel}>
				{label}
				{#if required}
					<span class="required-mark">*</span>
				{/if}
			</label>
		{/if}

		{#if success && !error}
			<span class="input-status success">
				<Check size={16} strokeWidth={2.5} />
			</span>
		{/if}

		{#if error}
			<span class="input-status error">
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
	.form-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-input-wrapper.is-disabled {
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

	/* Input container */
	.input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	/* Icon */
	.input-icon {
		position: absolute;
		left: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		pointer-events: none;
		transition: color 0.2s ease;
	}

	.input-container.focused .input-icon {
		color: var(--blu-primary, #0066ff);
	}

	.input-container.has-error .input-icon {
		color: var(--data-red, #ef4444);
	}

	/* Input */
	.form-input {
		width: 100%;
		min-height: 48px;
		padding: 14px 18px;
		font-size: 16px;
		color: var(--gray-900, #0f172a);
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-sm);
		outline: none;
		transition: all 0.2s ease;
	}

	.input-container.has-icon .form-input {
		padding-left: 44px;
	}

	.form-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.form-input:hover:not(:focus) {
		border-color: var(--gray-300, #cbd5e1);
	}

	.form-input:focus {
		border-color: var(--blu-primary, #0066ff);
		background: white;
		box-shadow: var(--shadow-input-focus, 0 0 0 3px rgba(0, 102, 255, 0.15));
	}

	.input-container.has-error .form-input {
		border-color: var(--data-red, #ef4444);
	}

	.input-container.has-error .form-input:focus {
		box-shadow: var(--shadow-input-error, 0 0 0 3px rgba(239, 68, 68, 0.15));
	}

	.input-container.success .form-input {
		border-color: var(--data-green, #10b981);
		padding-right: 44px;
	}

	.input-container.success .form-input:focus {
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
	}

	.input-container.has-error .form-input {
		padding-right: 44px;
	}

	/* Floating label variant */
	.form-input-wrapper.floating .input-container {
		position: relative;
	}

	.floating-label {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 16px;
		color: var(--gray-400, #94a3b8);
		pointer-events: none;
		transition: all 0.2s ease;
		background: var(--white, #dbe8f4);
		padding: 0 4px;
	}

	.input-container.has-icon .floating-label {
		left: 44px;
	}

	.floating-label.active {
		top: 0;
		font-size: 13px;
		color: var(--blu-primary, #0066ff);
	}

	.input-container.has-error .floating-label.active {
		color: var(--data-red, #ef4444);
	}

	/* Status icon */
	.input-status {
		position: absolute;
		right: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.input-status.success {
		color: var(--data-green, #10b981);
	}

	.input-status.error {
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
		.form-input,
		.floating-label,
		.input-icon {
			transition: none;
		}
	}
</style>
