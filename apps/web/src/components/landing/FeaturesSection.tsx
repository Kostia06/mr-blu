import { useRef, useEffect, useMemo } from 'preact/hooks';
import { Mic, Zap, FileStack, Shield } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { SectionWrapper } from './SectionWrapper';
import { useI18nStore } from '@/lib/i18n';

const styles = {
	container: {
		width: '100%',
	},
	header: {
		textAlign: 'center' as const,
		marginBottom: 60,
	},
	title: {
		fontFamily: 'var(--font-display)',
		fontSize: 'clamp(2rem, 5vw, 3rem)',
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		margin: '0 0 16px 0',
		letterSpacing: '-0.02em',
	},
	description: {
		fontSize: 18,
		color: 'var(--gray-600, #475569)',
		maxWidth: 520,
		margin: '0 auto',
		lineHeight: 1.6,
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: '1fr',
		gap: 24,
		maxWidth: 900,
		margin: '0 auto',
	},
};

const GRID_CSS = `
@media (min-width: 640px) {
	.features-grid {
		grid-template-columns: repeat(2, 1fr) !important;
		gap: 28px !important;
	}
}
`;

export function FeaturesSection() {
	const { t } = useI18nStore();
	const sectionRef = useRef<HTMLDivElement>(null);

	const features = useMemo(
		() => [
			{
				title: t('landing.features.feature1Title'),
				description: t('landing.features.feature1Desc'),
				icon: Mic,
				accent: 'blue' as const,
			},
			{
				title: t('landing.features.feature2Title'),
				description: t('landing.features.feature2Desc'),
				icon: Zap,
				accent: 'cyan' as const,
			},
			{
				title: t('landing.features.feature3Title'),
				description: t('landing.features.feature3Desc'),
				icon: FileStack,
				accent: 'green' as const,
			},
			{
				title: t('landing.features.feature4Title'),
				description: t('landing.features.feature4Desc'),
				icon: Shield,
				accent: 'amber' as const,
			},
		],
		[t]
	);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				const node = sectionRef.current;
				if (!node) return;

				ScrollTrigger.create({
					trigger: node,
					start: 'top 70%',
					onEnter: () => {
						const cards = node.querySelectorAll('.feature-item');
						gsap.fromTo(
							cards,
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
						);
					},
					once: true,
				});
			});
		});
	}, []);

	return (
		<SectionWrapper id="features" background="white">
			<style>{GRID_CSS}</style>
			<div style={styles.container} ref={sectionRef}>
				<div style={styles.header}>
					<h2 style={styles.title}>{t('landing.features.title')}</h2>
					<p style={styles.description}>{t('landing.features.description')}</p>
				</div>

				<div className="features-grid" style={styles.grid}>
					{features.map((feature) => (
						<div
							key={feature.title}
							className="feature-item"
						>
							<FeatureCard {...feature} />
						</div>
					))}
				</div>
			</div>
		</SectionWrapper>
	);
}
