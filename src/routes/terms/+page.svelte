<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>Terms of Service - mrblu</title>
</svelte:head>

<div class="legal-page">
	<div class="legal-container">
		<a href="/" class="back-link">&larr; Back</a>
		<h1>Terms of Service</h1>
		<p class="updated">Last updated: February 2026</p>

		<section>
			<h2>1. Acceptance of Terms</h2>
			<p>By accessing or using mrblu, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
		</section>

		<section>
			<h2>2. Description of Service</h2>
			<p>mrblu is a billing assistant that helps users capture, organize, and manage invoices and expenses through voice and document processing.</p>
		</section>

		<section>
			<h2>3. User Accounts</h2>
			<p>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account.</p>
		</section>

		<section>
			<h2>4. Acceptable Use</h2>
			<p>You agree not to misuse the service, interfere with its operation, or use it for any unlawful purpose.</p>
		</section>

		<section>
			<h2>5. Data and Privacy</h2>
			<p>Your use of mrblu is also governed by our <a href="/privacy">Privacy Policy</a>. We process your data as described therein.</p>
		</section>

		<section>
			<h2>6. Limitation of Liability</h2>
			<p>mrblu is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
		</section>

		<section>
			<h2>7. Changes to Terms</h2>
			<p>We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.</p>
		</section>

		<section>
			<h2>8. Contact</h2>
			<p>For questions about these terms, contact us at <a href="mailto:soporte@mrblu.com">soporte@mrblu.com</a>.</p>
		</section>
	</div>
</div>

<style>
	.legal-page {
		min-height: 100vh;
		background: var(--white, #dbe8f4);
		padding: 120px 24px 80px;
	}

	.legal-container {
		max-width: 640px;
		margin: 0 auto;
	}

	.back-link {
		display: inline-block;
		font-size: 14px;
		color: var(--gray-500, #64748b);
		text-decoration: none;
		margin-bottom: 32px;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--blu-primary, #0066ff);
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 2.5rem);
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		letter-spacing: -0.02em;
		margin: 0 0 8px 0;
	}

	.updated {
		font-size: 14px;
		color: var(--gray-500, #64748b);
		margin: 0 0 48px 0;
	}

	section {
		margin-bottom: 32px;
	}

	h2 {
		font-size: 18px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px 0;
	}

	p {
		font-size: 15px;
		line-height: 1.7;
		color: var(--gray-600, #475569);
		margin: 0;
	}

	a {
		color: var(--blu-primary, #0066ff);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
