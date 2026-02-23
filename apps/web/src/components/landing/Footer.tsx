import { useI18nStore } from '@/lib/i18n';

const styles = {
	footer: {
		background: 'var(--gray-50, #f8fafc)',
		borderTop: '1px solid var(--gray-200, #e2e8f0)',
		padding: '40px 24px',
	},
	container: {
		maxWidth: 1280,
		margin: '0 auto',
	},
	content: {
		textAlign: 'center' as const,
	},
	links: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
		marginBottom: 16,
	},
	link: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
		textDecoration: 'none',
		transition: 'color 0.2s ease',
	},
	copyright: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
		margin: 0,
	},
};

export function Footer() {
	const { t } = useI18nStore();
	const currentYear = new Date().getFullYear();

	return (
		<footer style={styles.footer}>
			<div style={styles.container}>
				<div style={styles.content}>
					<div style={styles.links}>
						<a
							href="/terms"
							style={styles.link}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--blu-primary, #0066ff)';
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--gray-500, #64748b)';
							}}
						>
							{t('landing.footer.terms')}
						</a>
						<a
							href="/privacy"
							style={styles.link}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--blu-primary, #0066ff)';
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--gray-500, #64748b)';
							}}
						>
							{t('landing.footer.privacy')}
						</a>
						<a
							href="mailto:soporte@mrblu.com"
							style={styles.link}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--blu-primary, #0066ff)';
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLElement).style.color = 'var(--gray-500, #64748b)';
							}}
						>
							{t('landing.footer.contact')}
						</a>
					</div>
					<p style={styles.copyright}>
						&copy; {currentYear} mrblu. {t('landing.footer.copyright')}
					</p>
				</div>
			</div>
		</footer>
	);
}
