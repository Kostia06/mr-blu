<script lang="ts">
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	interface Props {
		count?: number;
	}

	let { count = 5 }: Props = $props();
</script>

<div class="skeleton-list">
	{#each Array(count) as _, i}
		<div class="skeleton-item" style="animation-delay: {i * 100}ms">
			<!-- Icon skeleton -->
			<Skeleton variant="rect" width="48px" height="48px" class="skeleton-icon" />

			<!-- Content skeleton -->
			<div class="skeleton-content">
				<Skeleton variant="text" width="140px" height="16px" />
				<Skeleton variant="text" width="100px" height="13px" class="skeleton-meta" />
			</div>

			<!-- Amount skeleton -->
			<Skeleton variant="text" width="70px" height="16px" class="skeleton-amount" />
		</div>
	{/each}
</div>

<style>
	.skeleton-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.skeleton-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-button, 14px);
		opacity: 0;
		animation: fadeIn 0.3s ease forwards;
	}

	.skeleton-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	:global(.skeleton-icon) {
		border-radius: var(--radius-button, 14px) !important;
		flex-shrink: 0;
	}

	:global(.skeleton-meta) {
		opacity: 0.7;
	}

	:global(.skeleton-amount) {
		margin-left: auto;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
