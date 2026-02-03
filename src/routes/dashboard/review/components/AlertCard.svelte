<script lang="ts">
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Info from 'lucide-svelte/icons/info';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import type { Component } from 'svelte';

	interface Props {
		variant?: 'warning' | 'error' | 'info' | 'success';
		title: string;
		message?: string;
	}

	let { variant = 'warning', title, message }: Props = $props();

	const icons: Record<string, Component> = {
		warning: AlertTriangle,
		error: AlertCircle,
		info: Info,
		success: CheckCircle
	};

	const Icon = $derived(icons[variant]);
</script>

<div
	class="alert-card"
	class:warning={variant === 'warning'}
	class:error={variant === 'error'}
	class:info={variant === 'info'}
	class:success={variant === 'success'}
>
	<Icon size={20} />
	<div class="alert-content">
		<strong>{title}</strong>
		{#if message}
			<span>{message}</span>
		{/if}
	</div>
</div>

<style>
	.alert-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px 16px;
		border-radius: 12px;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		color: #d97706;
	}

	.alert-card.warning {
		background: rgba(245, 158, 11, 0.1);
		border-color: rgba(245, 158, 11, 0.3);
		color: #d97706;
	}

	.alert-card.error {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #dc2626;
	}

	.alert-card.info {
		background: rgba(59, 130, 246, 0.1);
		border-color: rgba(59, 130, 246, 0.3);
		color: #2563eb;
	}

	.alert-card.success {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
		color: #059669;
	}

	.alert-card :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.alert-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.alert-content strong {
		font-size: 14px;
		font-weight: 600;
	}

	.alert-content span {
		font-size: 13px;
		opacity: 0.9;
	}
</style>
