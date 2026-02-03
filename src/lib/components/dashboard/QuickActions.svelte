<script lang="ts">
	import { goto } from '$app/navigation';
	import FileText from 'lucide-svelte/icons/file-text';
	import FileCheck from 'lucide-svelte/icons/file-check';
	import Mic from 'lucide-svelte/icons/mic';

	interface QuickAction {
		id: string;
		label: string;
		description: string;
		icon: typeof FileText;
		href: string;
		color: 'primary' | 'green' | 'indigo';
	}

	const actions: QuickAction[] = [
		{
			id: 'invoice',
			label: 'New Invoice',
			description: 'Create an invoice',
			icon: FileText,
			href: '/dashboard?type=invoice',
			color: 'primary'
		},
		{
			id: 'estimate',
			label: 'New Estimate',
			description: 'Create an estimate',
			icon: FileCheck,
			href: '/dashboard?type=estimate',
			color: 'green'
		},
		{
			id: 'voice',
			label: 'Voice Input',
			description: 'Speak your document',
			icon: Mic,
			href: '/dashboard',
			color: 'indigo'
		}
	];

	function handleActionClick(action: QuickAction) {
		goto(action.href);
	}
</script>

<div class="quick-actions">
	<h3 class="section-title">Quick Actions</h3>

	<div class="actions-grid">
		{#each actions as action (action.id)}
			{@const IconComponent = action.icon}
			<button class="action-card {action.color}" onclick={() => handleActionClick(action)}>
				<div class="action-icon">
					<IconComponent size={24} strokeWidth={1.5} />
				</div>
				<div class="action-content">
					<span class="action-label">{action.label}</span>
					<span class="action-description">{action.description}</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--gray-900);
		margin: 0;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--white);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-xl);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out-expo);
		box-shadow: var(--blu-shadow-card);
		text-align: center;
		min-height: 120px;
	}

	.action-card:hover {
		border-color: var(--blu-border-hover);
		box-shadow: var(--blu-shadow-card-hover);
		transform: translateY(-2px);
	}

	.action-card:active {
		transform: translateY(0) scale(0.98);
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		transition: all var(--duration-fast) ease;
	}

	/* Primary (blue) */
	.action-card.primary .action-icon {
		background: var(--glass-primary-10);
		color: var(--blu-primary);
	}

	.action-card.primary:hover .action-icon {
		background: var(--glass-primary-20);
	}

	/* Green */
	.action-card.green .action-icon {
		background: var(--glass-green-10);
		color: var(--data-green);
	}

	.action-card.green:hover .action-icon {
		background: var(--glass-green-20);
	}

	/* Indigo */
	.action-card.indigo .action-icon {
		background: rgba(99, 102, 241, 0.1);
		color: var(--data-indigo);
	}

	.action-card.indigo:hover .action-icon {
		background: rgba(99, 102, 241, 0.2);
	}

	.action-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
	}

	.action-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--gray-900);
	}

	.action-description {
		font-size: var(--text-xs);
		color: var(--gray-500);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.action-card,
		.action-icon {
			transition: none;
		}

		.action-card:hover,
		.action-card:active {
			transform: none;
		}
	}

	/* Tablet and mobile adjustments */
	@media (max-width: 640px) {
		.actions-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: var(--space-2);
		}

		.action-card {
			padding: var(--space-3);
			min-height: 100px;
			gap: var(--space-2);
		}

		.action-icon {
			width: 40px;
			height: 40px;
		}

		.action-icon :global(svg) {
			width: 20px;
			height: 20px;
		}

		.action-label {
			font-size: var(--text-xs);
		}

		.action-description {
			display: none;
		}
	}

	/* Very small screens */
	@media (max-width: 360px) {
		.action-card {
			padding: var(--space-2);
			min-height: 80px;
		}

		.action-icon {
			width: 36px;
			height: 36px;
		}
	}

	/* Touch target sizing */
	@media (pointer: coarse) {
		.action-card {
			min-height: 100px;
		}
	}
</style>
