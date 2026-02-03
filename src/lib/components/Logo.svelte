<script lang="ts">
	type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type Variant = 'full' | 'icon' | 'detailed';

	interface Props {
		class?: string;
		size?: Size;
		variant?: Variant;
		showText?: boolean;
	}

	let { class: className = '', size = 'md', variant = 'full', showText = true }: Props = $props();

	const sizeClasses: Record<Size, { icon: string; text: string; gap: string }> = {
		xs: { icon: 'w-5 h-5', text: 'text-sm', gap: 'gap-1' },
		sm: { icon: 'w-6 h-6', text: 'text-base', gap: 'gap-1.5' },
		md: { icon: 'w-8 h-8', text: 'text-xl', gap: 'gap-2' },
		lg: { icon: 'w-10 h-10', text: 'text-2xl', gap: 'gap-2.5' },
		xl: { icon: 'w-12 h-12', text: 'text-3xl', gap: 'gap-3' }
	};

	const currentSize = $derived(sizeClasses[size]);
</script>

<div class="flex items-center {currentSize.gap} {className}">
	<span
		class="{currentSize.text} font-bold"
		style="font-family: var(--font-display); color: var(--blu-primary, #0066FF);">mrblu</span
	>
</div>
