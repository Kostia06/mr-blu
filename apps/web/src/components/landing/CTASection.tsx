import { useRef, useEffect } from 'preact/hooks';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { useI18nStore } from '@/lib/i18n';

interface CTASectionProps {
	isAuthenticated?: boolean;
}

const styles = {
	container: {
		textAlign: 'center' as const,
		maxWidth: 700,
		margin: '0 auto',
	},
	content: {},
	title: {
		fontFamily: 'var(--font-display)',
		fontSize: 'clamp(2rem, 6vw, 3.5rem)',
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		margin: '0 0 16px 0',
		letterSpacing: '-0.02em',
		lineHeight: 1.1,
	},
	description: {
		fontSize: 18,
		color: 'var(--gray-600, #475569)',
		margin: '0 0 32px 0',
		lineHeight: 1.6,
	},
	button: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 10,
		padding: '18px 36px',
		background: 'var(--blu-primary, #0066ff)',
		color: 'white',
		fontSize: 17,
		fontWeight: 600,
		textDecoration: 'none',
		borderRadius: 100,
		transition: 'background 0.2s ease, box-shadow 0.2s ease',
	},
};

const CTA_CSS = `
@media (prefers-reduced-motion: reduce) {
	.cta-content-inner {
		opacity: 1 !important;
	}
}
`;

export function CTASection({ isAuthenticated = false }: CTASectionProps) {
	const { t } = useI18nStore();
	const sectionRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				const node = sectionRef.current;
				if (!node) return;

				ScrollTrigger.create({
					trigger: node,
					start: 'top 75%',
					onEnter: () => {
						gsap.fromTo(
							node.querySelector('.cta-content-inner'),
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }
						);
					},
					once: true,
				});
			});
		});
	}, []);

	return (
		<SectionWrapper id="cta" background="white" padding="large">
			<style>{CTA_CSS}</style>
			<div style={styles.container} ref={sectionRef}>
				<div className="cta-content-inner" style={styles.content}>
					<h2 style={styles.title}>
						{isAuthenticated ? t('landing.cta.titleLoggedIn') : t('landing.cta.title')}
					</h2>
					<p style={styles.description}>
						{isAuthenticated ? t('landing.cta.descriptionLoggedIn') : t('landing.cta.description')}
					</p>

					{isAuthenticated ? (
						<a
							href="/dashboard"
							style={styles.button}
							onMouseEnter={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.background = 'var(--blu-primary-hover, #0052cc)';
								el.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.3)';
							}}
							onMouseLeave={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.background = 'var(--blu-primary, #0066ff)';
								el.style.boxShadow = 'none';
							}}
						>
							<LayoutDashboard size={20} strokeWidth={2.5} />
							<span>{t('landing.hero.ctaDashboard')}</span>
						</a>
					) : (
						<a
							href="/login"
							style={styles.button}
							onMouseEnter={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.background = 'var(--blu-primary-hover, #0052cc)';
								el.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.3)';
							}}
							onMouseLeave={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.background = 'var(--blu-primary, #0066ff)';
								el.style.boxShadow = 'none';
							}}
						>
							<span>{t('landing.hero.ctaPrimary')}</span>
							<ArrowRight size={20} strokeWidth={2.5} />
						</a>
					)}
				</div>
			</div>
		</SectionWrapper>
	);
}
