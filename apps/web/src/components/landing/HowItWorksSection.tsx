import { useRef, useState, useEffect, useMemo } from 'preact/hooks';
import { Mic, FileText, Send } from 'lucide-react';
import { StepCard } from './StepCard';
import { StepConnector } from './StepConnector';
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
		maxWidth: 480,
		margin: '0 auto',
		lineHeight: 1.6,
	},
	stepsContainer: {
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		alignItems: 'center',
		gap: 24,
	},
};

const SECTION_CSS = `
@media (min-width: 900px) {
	.hiw-steps-container {
		flex-direction: row !important;
		justify-content: center;
		gap: 0 !important;
	}
}
`;

export function HowItWorksSection() {
	const { t } = useI18nStore();
	const sectionRef = useRef<HTMLDivElement>(null);
	const [animated, setAnimated] = useState(false);

	const steps = useMemo(
		() => [
			{
				step: 1,
				title: t('landing.howItWorks.step1Title'),
				description: t('landing.howItWorks.step1Desc'),
				icon: Mic,
			},
			{
				step: 2,
				title: t('landing.howItWorks.step2Title'),
				description: t('landing.howItWorks.step2Desc'),
				icon: FileText,
			},
			{
				step: 3,
				title: t('landing.howItWorks.step3Title'),
				description: t('landing.howItWorks.step3Desc'),
				icon: Send,
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
						setAnimated(true);
						const cards = node.querySelectorAll('.step-card');
						gsap.fromTo(
							cards,
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.2 }
						);
					},
					once: true,
				});
			});
		});
	}, []);

	return (
		<SectionWrapper id="how-it-works" background="gray">
			<style>{SECTION_CSS}</style>
			<div style={styles.container} ref={sectionRef}>
				<div style={styles.header}>
					<h2 style={styles.title}>{t('landing.howItWorks.title')}</h2>
					<p style={styles.description}>{t('landing.howItWorks.description')}</p>
				</div>

				<div className="hiw-steps-container" style={styles.stepsContainer}>
					{steps.map((stepData, i) => (
						<>
							<div key={stepData.step}>
								<StepCard {...stepData} />
							</div>
							{i < steps.length - 1 && (
								<StepConnector animated={animated} delay={0.4 + i * 0.3} />
							)}
						</>
					))}
				</div>
			</div>
		</SectionWrapper>
	);
}
