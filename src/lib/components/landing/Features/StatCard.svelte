<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		value: string;
		label: string;
		suffix?: string;
		animate?: boolean;
	}

	let { value, label, suffix = '', animate = true }: Props = $props();

	// Use $derived to properly react to prop changes
	let initialValue = $derived(animate ? '0' : value);
	let displayValue = $state('0');
	let cardRef: HTMLDivElement;
	let hasInitialized = false;

	// Set initial value when props are ready
	$effect(() => {
		if (!hasInitialized) {
			displayValue = initialValue;
			hasInitialized = true;
		}
	});

	onMount(() => {
		if (!browser || !animate) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				ScrollTrigger.create({
					trigger: cardRef,
					start: 'top 80%',
					onEnter: () => {
						// Parse the numeric value
						const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
						const hasDecimal = value.includes('.');
						const prefix = value.match(/^[^0-9]*/)?.[0] || '';

						gsap.to(
							{ val: 0 },
							{
								val: numericValue,
								duration: 1.5,
								ease: 'power2.out',
								onUpdate: function () {
									const current = this.targets()[0].val;
									if (hasDecimal) {
										displayValue = prefix + current.toFixed(1);
									} else {
										displayValue = prefix + Math.floor(current).toLocaleString();
									}
								}
							}
						);
					},
					once: true
				});
			});
		});
	});
</script>

<div class="stat-card" bind:this={cardRef}>
	<div class="stat-value">
		<span class="value">{displayValue}</span>
		{#if suffix}
			<span class="suffix">{suffix}</span>
		{/if}
	</div>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px 24px;
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.04) 0%, rgba(14, 165, 233, 0.02) 100%);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 20px;
		text-align: center;
		height: 100%;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		border-color: var(--blu-primary, #0066ff);
		box-shadow: 0 10px 40px -10px rgba(0, 102, 255, 0.12);
	}

	.stat-value {
		display: flex;
		align-items: baseline;
		gap: 2px;
		margin-bottom: 4px;
	}

	.value {
		font-family: var(--font-mono, 'JetBrains Mono', monospace);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--blu-primary, #0066ff);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.suffix {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--blu-primary, #0066ff);
	}

	.stat-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
