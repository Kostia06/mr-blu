import { useState, useEffect, useCallback } from 'preact/hooks';
import { ArrowRight, Globe, LayoutDashboard } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { Logo } from '@/components/ui/Logo';

interface NavbarProps {
	isAuthenticated?: boolean;
}

const styles = {
	skipLink: {
		position: 'absolute' as const,
		top: 16,
		left: 16,
		zIndex: 100,
		padding: '12px 24px',
		background: 'var(--blu-primary, #0066ff)',
		color: 'white',
		fontWeight: 600,
		borderRadius: 8,
		textDecoration: 'none',
		transform: 'translateY(calc(-100% - 16px))',
		transition: 'transform 0.2s ease',
	},
	navbar: {
		position: 'fixed' as const,
		top: 0,
		left: 0,
		right: 0,
		zIndex: 50,
		padding: '0 24px',
	},
	navContainer: {
		width: '100%',
		maxWidth: 1280,
		margin: '0 auto',
	},
	navContent: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '20px 0',
		background: 'transparent',
		transition: 'padding 0.3s ease',
	},
	logoLink: {
		textDecoration: 'none',
	},
	logoText: {
		fontSize: 28,
		fontWeight: 800,
		color: 'var(--blu-primary, #0066ff)',
		letterSpacing: -0.5,
	},
	navActions: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		padding: 5,
		background: 'rgba(255, 255, 255, 0.6)',
		backdropFilter: 'blur(24px) saturate(180%)',
		WebkitBackdropFilter: 'blur(24px) saturate(180%)',
		border: '1px solid rgba(255, 255, 255, 0.7)',
		borderRadius: 100,
		boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
	},
	langToggle: {
		display: 'flex',
		alignItems: 'center',
		gap: 5,
		padding: '10px 14px',
		background: 'transparent',
		border: 'none',
		color: 'var(--gray-600, #475569)',
		fontSize: 13,
		fontWeight: 600,
		cursor: 'pointer',
		borderRadius: 100,
		transition: 'all 0.2s ease',
	},
	ctaButton: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		padding: '10px 18px',
		background: 'var(--blu-primary, #0066ff)',
		color: 'white',
		fontSize: 14,
		fontWeight: 600,
		textDecoration: 'none',
		borderRadius: 100,
		transition: 'all 0.2s ease',
		boxShadow: '0 2px 10px rgba(0, 102, 255, 0.25)',
	},
};

export function Navbar({ isAuthenticated = false }: NavbarProps) {
	const { locale, setLocale, t } = useI18nStore();
	const [scrolled, setScrolled] = useState(false);

	const handleScroll = useCallback(() => {
		setScrolled(window.scrollY > 20);
	}, []);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	function toggleLanguage() {
		const newLocale = locale === 'en' ? 'es' : 'en';
		setLocale(newLocale);
	}

	return (
		<>
			<a
				href="#main-content"
				style={styles.skipLink}
				onFocus={(e) => {
					(e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
				}}
				onBlur={(e) => {
					(e.currentTarget as HTMLElement).style.transform = 'translateY(calc(-100% - 16px))';
				}}
			>
				{t('landing.nav.skipToContent')}
			</a>

			<header style={{
				...styles.navbar,
				background: scrolled ? 'rgba(219, 232, 244, 0.85)' : 'transparent',
				backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
				WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
				boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
				transition: 'background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease',
			}}>
				<nav style={styles.navContainer} aria-label="Main navigation">
					<div style={styles.navContent}>
						<a href="/" style={styles.logoLink} aria-label="mrblu Home">
							<Logo size="md" />
						</a>

						<div style={styles.navActions}>
							<button
								style={styles.langToggle}
								onClick={toggleLanguage}
								aria-label={t('aria.switchLanguage')}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.color = 'var(--blu-primary, #0066ff)';
									(e.currentTarget as HTMLElement).style.background = 'rgba(0, 102, 255, 0.08)';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.color = 'var(--gray-600, #475569)';
									(e.currentTarget as HTMLElement).style.background = 'transparent';
								}}
							>
								<Globe size={16} strokeWidth={2} />
								<span>{locale.toUpperCase()}</span>
							</button>

							{isAuthenticated ? (
								<a href="/dashboard" style={styles.ctaButton}>
									<LayoutDashboard size={14} strokeWidth={2.5} />
									<span>{t('landing.nav.dashboard')}</span>
								</a>
							) : (
								<a href="/login" style={styles.ctaButton}>
									<span>{t('landing.nav.getStarted')}</span>
									<ArrowRight size={14} strokeWidth={2.5} />
								</a>
							)}
						</div>
					</div>
				</nav>
			</header>
		</>
	);
}
