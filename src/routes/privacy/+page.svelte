<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>Privacy Policy - mrblu</title>
</svelte:head>

<div class="legal-page">
	<div class="legal-container">
		<a href="/" class="back-link">&larr; Back</a>
		<h1>Privacy Policy</h1>
		<p class="updated">Last updated: February 2026</p>

		<section>
			<h2>1. Information We Collect</h2>
			<p>We collect information you provide directly: account details (email, name), uploaded documents (invoices, receipts), and voice recordings for transcription.</p>
		</section>

		<section>
			<h2>2. How We Use Your Information</h2>
			<p>Your data is used to provide the mrblu service: processing documents, generating summaries, and organizing your billing information.</p>
		</section>

		<section>
			<h2>3. Data Storage</h2>
			<p>Your data is stored securely using industry-standard encryption. We use Supabase for authentication and data storage.</p>
		</section>

		<section>
			<h2>4. Data Sharing</h2>
			<p>We do not sell your personal data. We may share data with third-party services strictly necessary for operating the platform (e.g., AI processing, cloud storage).</p>
		</section>

		<section>
			<h2>5. Your Rights</h2>
			<p>You may request access to, correction of, or deletion of your personal data at any time by contacting us.</p>
		</section>

		<section>
			<h2>6. Cookies</h2>
			<p>We use essential cookies for authentication and session management. No tracking or advertising cookies are used.</p>
		</section>

		<section>
			<h2>7. Changes to This Policy</h2>
			<p>We may update this policy periodically. We will notify you of significant changes through the service.</p>
		</section>

		<section>
			<h2>8. Contact</h2>
			<p>For privacy-related questions, contact us at <a href="mailto:soporte@mrblu.com">soporte@mrblu.com</a>.</p>
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
