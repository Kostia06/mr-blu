<script lang="ts">
	import { t } from '$lib/i18n';

	const currentYear = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="footer-container">
		<div class="footer-content">
			<div class="footer-links">
				<a href="/terms">{$t('landing.footer.terms')}</a>
				<a href="/privacy">{$t('landing.footer.privacy')}</a>
				<a href="mailto:soporte@mrblu.com">{$t('landing.footer.contact')}</a>
			</div>
			<p class="copyright">&copy; {currentYear} mrblu. {$t('landing.footer.copyright')}</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--gray-50, #f8fafc);
		border-top: 1px solid var(--gray-200, #e2e8f0);
		padding: 40px 24px;
	}

	.footer-container {
		max-width: 1280px;
		margin: 0 auto;
	}

	.footer-content {
		text-align: center;
	}

	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24px;
		margin-bottom: 16px;
	}

	.footer-links a {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: var(--blu-primary, #0066ff);
	}

	.copyright {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		margin: 0;
	}
</style>
