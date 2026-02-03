<script lang="ts">
	import { reveal, stagger } from '$lib/animations';
	import Card from '$lib/components/ui/Card.svelte';

	const steps = [
		{
			number: '01',
			title: 'Record',
			description:
				'Speak naturally about the job, client, and pricing. Our AI understands context.',
			icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="24" cy="24" r="18" opacity="0.2" fill="currentColor" stroke="none" />
				<circle cx="24" cy="24" r="8" />
				<path d="M24 16v-4M24 36v-4M32 24h4M12 24h4" stroke-linecap="round" />
			</svg>`
		},
		{
			number: '02',
			title: 'Process',
			description:
				'AI extracts client info, line items, and amounts. Creates a professional document.',
			icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="8" y="8" width="32" height="32" rx="4" opacity="0.2" fill="currentColor" stroke="none" />
				<path d="M16 20h16M16 28h10" stroke-linecap="round" />
				<circle cx="34" cy="34" r="6" />
				<path d="M32 34l2 2 3-3" stroke-linecap="round" stroke-linejoin="round" />
			</svg>`
		},
		{
			number: '03',
			title: 'Done',
			description: 'Review and send via email, SMS, or share link. Get paid faster.',
			icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 24l8 8 16-16" opacity="0.2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M12 24l8 8 16-16" stroke-linecap="round" stroke-linejoin="round" />
			</svg>`
		}
	];
</script>

<section id="how-it-works" class="how-it-works">
	<div class="container">
		<!-- Section Header -->
		<div class="section-header" use:reveal={{ delay: 0 }}>
			<span class="section-label">How It Works</span>
			<h2 class="section-title">Three steps to professional documents</h2>
			<p class="section-description">
				No typing required. Just describe your work and let AI do the rest.
			</p>
		</div>

		<!-- Steps -->
		<div class="steps-grid" use:stagger={{ staggerDelay: 150, baseDelay: 200 }}>
			{#each steps as step, i}
				<div class="step-wrapper">
					<Card variant="glass" tiltEffect={true} class="step-card">
						<div class="step-content">
							<div class="step-number">{step.number}</div>
							<div class="step-icon">
								{@html step.icon}
							</div>
							<h3 class="step-title">{step.title}</h3>
							<p class="step-description">{step.description}</p>
						</div>
					</Card>

					<!-- Connector Line -->
					{#if i < steps.length - 1}
						<div class="connector">
							<svg viewBox="0 0 100 20" preserveAspectRatio="none">
								<path
									d="M0 10 H100"
									stroke="url(#connector-gradient)"
									stroke-width="2"
									stroke-dasharray="6 4"
									fill="none"
								/>
								<defs>
									<linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
										<stop offset="0%" stop-color="var(--blu-primary)" stop-opacity="0.5" />
										<stop offset="100%" stop-color="var(--blu-primary)" stop-opacity="0" />
									</linearGradient>
								</defs>
							</svg>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.how-it-works {
		position: relative;
		padding: 120px 0;
		background: var(--blu-bg-darker);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.section-header {
		text-align: center;
		margin-bottom: 80px;
	}

	.section-label {
		display: inline-block;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--blu-primary);
		margin-bottom: 16px;
		padding: 8px 16px;
		background: rgba(var(--blu-primary-rgb), 0.1);
		border-radius: 20px;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		font-weight: 700;
		color: white;
		margin: 0 0 16px;
		letter-spacing: -0.02em;
	}

	.section-description {
		font-size: var(--text-lg);
		color: rgba(219, 232, 244, 0.6);
		max-width: 500px;
		margin: 0 auto;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 40px;
	}

	@media (min-width: 768px) {
		.steps-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 24px;
		}
	}

	.step-wrapper {
		position: relative;
	}

	:global(.step-card) {
		height: 100%;
		padding: 32px;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.step-number {
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 700;
		color: var(--blu-primary);
		letter-spacing: 0.1em;
		margin-bottom: 24px;
	}

	.step-icon {
		width: 80px;
		height: 80px;
		margin-bottom: 24px;
		color: var(--blu-primary);
	}

	.step-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.step-title {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 700;
		color: white;
		margin: 0 0 12px;
	}

	.step-description {
		font-size: var(--text-base);
		color: rgba(219, 232, 244, 0.6);
		line-height: 1.6;
		margin: 0;
	}

	.connector {
		display: none;
		position: absolute;
		top: 50%;
		right: -24px;
		width: 48px;
		transform: translateY(-50%);
	}

	@media (min-width: 768px) {
		.connector {
			display: block;
		}
	}
</style>
