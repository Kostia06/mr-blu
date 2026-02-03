<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Stat {
		value: string;
		label: string;
		suffix?: string;
	}

	interface Props {
		stats?: Stat[];
	}

	const defaultStats = $derived([
		{ value: '500', suffix: '+', label: $t('landing.testimonials.stat1Label') },
		{ value: '5', suffix: ' hrs', label: $t('landing.testimonials.stat2Label') },
		{ value: '10', suffix: 'k+', label: $t('landing.testimonials.stat3Label') }
	]);

	let { stats = defaultStats }: Props = $props();

	// Use $derived to properly track stats length
	let statsCount = $derived(stats.length);
	let displayValues = $state<string[]>([]);
	let barRef: HTMLDivElement;
	let hasInitialized = false;

	// Initialize display values when stats change
	$effect(() => {
		if (!hasInitialized || displayValues.length !== statsCount) {
			displayValues = stats.map(() => '0');
			hasInitialized = true;
		}
	});

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				ScrollTrigger.create({
					trigger: barRef,
					start: 'top 85%',
					onEnter: () => {
						stats.forEach((stat, index) => {
							const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ''));

							gsap.to(
								{ val: 0 },
								{
									val: numericValue,
									duration: 1.5,
									ease: 'power2.out',
									delay: index * 0.2,
									onUpdate: function () {
										const current = this.targets()[0].val;
										displayValues[index] = Math.floor(current).toString();
									}
								}
							);
						});
					},
					once: true
				});
			});
		});
	});
</script>

<div class="stats-bar" bind:this={barRef}>
	{#each stats as stat, i (stat.label)}
		<div class="stat-item">
			<span class="stat-value">
				{displayValues[i]}{stat.suffix || ''}
			</span>
			<span class="stat-label">{stat.label}</span>
		</div>
		{#if i < stats.length - 1}
			<div class="stat-divider"></div>
		{/if}
	{/each}
</div>

<style>
	.stats-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24px;
		padding: 32px;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 20px;
		flex-wrap: wrap;
	}

	@media (min-width: 640px) {
		.stats-bar {
			gap: 40px;
			padding: 40px 60px;
		}
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.stat-value {
		font-family: var(--font-mono, 'JetBrains Mono', monospace);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.stat-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 4px;
	}

	.stat-divider {
		width: 1px;
		height: 40px;
		background: var(--gray-200, #e2e8f0);
		display: none;
	}

	@media (min-width: 640px) {
		.stat-divider {
			display: block;
		}
	}
</style>
