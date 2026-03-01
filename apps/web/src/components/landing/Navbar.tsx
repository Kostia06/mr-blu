import { useState, useEffect, useCallback } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Navbar() {
	const { t } = useI18nStore();
	const [scrolled, setScrolled] = useState(false);

	const handleScroll = useCallback(() => {
		setScrolled(window.scrollY > 20);
	}, []);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<>
			<a
				href="#main-content"
				className="absolute top-4 left-4 z-[100] px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg no-underline -translate-y-[calc(100%+16px)] transition-transform duration-200 focus:translate-y-0"
			>
				{t('landing.nav.skipToContent')}
			</a>

			<header className={cn(
				"fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-300 border-b",
				scrolled
					? "bg-white/80 backdrop-blur-[20px] border-gray-100"
					: "bg-transparent border-transparent"
			)}>
				<nav className="w-full max-w-7xl mx-auto" aria-label="Main navigation">
					<div className="flex items-center justify-between h-16">
						<a href="/" className="no-underline flex items-center gap-2" aria-label="mrblu Home">
							<span className="text-[22px] font-extrabold text-[var(--blu-primary)] -tracking-[0.5px] leading-none font-[var(--font-display)]">
								mrblu
							</span>
							<span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--blu-primary)] bg-blue-50 border border-blue-100 rounded">
								beta
							</span>
						</a>

						<a
							href="/login"
							className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--blu-primary)] text-white text-[13px] font-semibold no-underline rounded-full shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:bg-[#0052cc] hover:shadow-[0_4px_20px_rgba(0,102,255,0.3)] transition-all duration-200"
						>
							<span>{t('landing.nav.signIn')}</span>
						</a>
					</div>
				</nav>
			</header>
		</>
	);
}
