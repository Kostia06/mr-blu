<script lang="ts">
	interface Props {
		variant?: 'text' | 'circle' | 'rect' | 'card';
		width?: string;
		height?: string;
		class?: string;
	}

	let {
		variant = 'text',
		width,
		height,
		class: className = ''
	}: Props = $props();

	const variantClasses = {
		text: 'skeleton-text',
		circle: 'skeleton-circle',
		rect: 'skeleton-rect',
		card: 'skeleton-card'
	};
</script>

<div
	class="skeleton {variantClasses[variant]} {className}"
	style:width
	style:height
	role="status"
	aria-label="Loading..."
></div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--gray-100, #f1f5f9) 0%,
			var(--gray-200, #e2e8f0) 50%,
			var(--gray-100, #f1f5f9) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
		border-radius: var(--radius-sm, 10px);
	}

	.skeleton-text {
		height: 1em;
		width: 100%;
		border-radius: 4px;
	}

	.skeleton-circle {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}

	.skeleton-rect {
		width: 100%;
		height: 100px;
		border-radius: var(--radius-md, 14px);
	}

	.skeleton-card {
		width: 100%;
		height: 120px;
		border-radius: var(--radius-lg, 20px);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
