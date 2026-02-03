<script lang="ts">
	interface Props {
		src?: string | null;
		alt?: string;
		name?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
		class?: string;
	}

	let { src, alt = '', name = '', size = 'md', class: className = '' }: Props = $props();

	let imageError = $state(false);

	function getInitials(name: string): string {
		if (!name) return '?';
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) {
			return parts[0].charAt(0).toUpperCase();
		}
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	// Returns gradient index (1-6) based on name hash
	function getGradientIndex(name: string): number {
		const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return (hash % 6) + 1;
	}

	const initials = $derived(getInitials(name));
	const gradientIndex = $derived(getGradientIndex(name));
</script>

<div class="avatar avatar-{size} {className}">
	{#if src && !imageError}
		<img
			{src}
			{alt}
			class="avatar-image"
			loading="lazy"
			decoding="async"
			onerror={() => (imageError = true)}
		/>
	{:else}
		<div class="avatar-fallback avatar-gradient-{gradientIndex}">
			{initials}
		</div>
	{/if}
</div>

<style>
	.avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		overflow: hidden;
		flex-shrink: 0;
	}

	/* Sizes using design tokens */
	.avatar-xs {
		width: var(--avatar-xs);
		height: var(--avatar-xs);
		font-size: var(--text-xs);
	}

	.avatar-sm {
		width: var(--avatar-sm);
		height: var(--avatar-sm);
		font-size: var(--text-sm);
	}

	.avatar-md {
		width: var(--avatar-md);
		height: var(--avatar-md);
		font-size: var(--text-base);
	}

	.avatar-lg {
		width: var(--avatar-lg);
		height: var(--avatar-lg);
		font-size: var(--text-xl);
	}

	.avatar-xl {
		width: var(--avatar-xl);
		height: var(--avatar-xl);
		font-size: var(--text-2xl);
	}

	.avatar-2xl {
		width: var(--avatar-2xl);
		height: var(--avatar-2xl);
		font-size: var(--text-3xl);
	}

	.avatar-3xl {
		width: var(--avatar-3xl);
		height: var(--avatar-3xl);
		font-size: var(--text-4xl);
	}

	/* Image */
	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Fallback */
	.avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-weight: var(--font-semibold);
		color: var(--glass-white-90);
		letter-spacing: var(--tracking-wide);
		text-shadow: 0 1px 2px var(--glass-black-20);
	}

	/* Gradient backgrounds using design tokens */
	.avatar-gradient-1 {
		background: var(--avatar-gradient-1);
	}

	.avatar-gradient-2 {
		background: var(--avatar-gradient-2);
	}

	.avatar-gradient-3 {
		background: var(--avatar-gradient-3);
	}

	.avatar-gradient-4 {
		background: var(--avatar-gradient-4);
	}

	.avatar-gradient-5 {
		background: var(--avatar-gradient-5);
	}

	.avatar-gradient-6 {
		background: var(--avatar-gradient-6);
	}
</style>
