import { useState, useEffect } from 'preact/hooks';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { HeroHeadline } from './HeroHeadline';
import { HeroPhone } from './HeroPhone';
import { useI18nStore } from '@/lib/i18n';

interface HeroSectionProps {
	isAuthenticated?: boolean;
}

const HERO_CSS = `
@media (min-width: 1024px) {
	.hero-container {
		max-width: 1280px !important;
		flex-direction: row !important;
		gap: 60px !important;
		justify-content: center;
	}
	.hero-content {
		order: 0 !important;
		align-items: flex-start !important;
		text-align: left !important;
		flex: 1;
		max-width: 560px;
	}
	.hero-content h1 {
		text-align: left;
	}
	.hero-content p {
		margin-left: 0;
	}
	.hero-visual {
		order: 0 !important;
		flex-shrink: 0;
		width: auto !important;
	}
	.hero-cta-container {
		justify-content: flex-start !important;
	}
}

.hero-trust {
	display: flex;
	align-items: center;
	gap: 20px;
	margin-top: 24px;
	flex-wrap: wrap;
	justify-content: center;
}
@media (min-width: 1024px) {
	.hero-trust { justify-content: flex-start; }
}
.hero-trust span {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 500;
	color: var(--gray-500, #64748b);
}
.hero-trust-dot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: var(--data-green, #10b981);
	flex-shrink: 0;
}
`;

const styles = {
	hero: {
		position: 'relative' as const,
		minHeight: '100vh',
		display: 'flex',
		alignItems: 'center',
		padding: '120px 24px 80px',
		overflowX: 'clip' as const,
		background: 'transparent',
	},
	heroContainer: {
		position: 'relative' as const,
		zIndex: 2,
		width: '100%',
		maxWidth: 600,
		margin: '0 auto',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 40,
		alignItems: 'center',
	},
	heroContent: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		textAlign: 'center' as const,
		order: 1,
	},
	ctaContainer: {
		display: 'flex',
		justifyContent: 'center',
		marginTop: 32,
	},
	ctaBtn: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 8,
		padding: '16px 32px',
		fontSize: 15,
		fontWeight: 600,
		textDecoration: 'none',
		borderRadius: 100,
		background: 'var(--blu-primary, #0066ff)',
		color: 'white',
		transition: 'box-shadow 0.2s ease, background 0.2s ease, opacity 0.6s ease',
		transitionDelay: '0.4s',
	},
	heroVisual: {
		display: 'flex',
		flexDirection: 'column' as const,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		order: -1,
		transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
		transitionDelay: '0.2s',
	},
};

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
	const { t } = useI18nStore();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		requestAnimationFrame(() => {
			setVisible(true);
		});
	}, []);

	const ctaBtnStyle = {
		...styles.ctaBtn,
		opacity: visible ? 1 : 0,
	};

	const heroVisualStyle = {
		...styles.heroVisual,
		opacity: visible ? 1 : 0,
		transform: visible ? 'translateY(0)' : 'translateY(24px)',
	};

	return (
		<section style={styles.hero} id="main-content">
			<style>{HERO_CSS}</style>
			<div className="hero-container" style={styles.heroContainer}>
				<div className="hero-content" style={styles.heroContent}>
					<HeroHeadline />
					<div className="hero-cta-container" style={styles.ctaContainer}>
						{isAuthenticated ? (
							<a
								href="/dashboard"
								style={ctaBtnStyle}
								onMouseEnter={(e) => {
									const el = e.currentTarget as HTMLElement;
									el.style.background = '#0052cc';
									el.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.3)';
								}}
								onMouseLeave={(e) => {
									const el = e.currentTarget as HTMLElement;
									el.style.background = 'var(--blu-primary, #0066ff)';
									el.style.boxShadow = 'none';
								}}
							>
								<LayoutDashboard size={18} strokeWidth={2.5} />
								<span>{t('landing.hero.ctaDashboard')}</span>
							</a>
						) : (
							<a
								href="/login"
								style={ctaBtnStyle}
								onMouseEnter={(e) => {
									const el = e.currentTarget as HTMLElement;
									el.style.background = '#0052cc';
									el.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.3)';
								}}
								onMouseLeave={(e) => {
									const el = e.currentTarget as HTMLElement;
									el.style.background = 'var(--blu-primary, #0066ff)';
									el.style.boxShadow = 'none';
								}}
							>
								<span>{t('landing.hero.ctaPrimary')}</span>
								<ArrowRight size={18} strokeWidth={2.5} />
							</a>
						)}
					</div>

					{!isAuthenticated && (
						<div className="hero-trust">
							<span><div className="hero-trust-dot" />{t('landing.hero.trust1')}</span>
							<span><div className="hero-trust-dot" />{t('landing.hero.trust2')}</span>
							<span><div className="hero-trust-dot" />{t('landing.hero.trust3')}</span>
						</div>
					)}
				</div>

				<div className="hero-visual" style={heroVisualStyle}>
					<HeroPhone />
				</div>
			</div>
		</section>
	);
}
