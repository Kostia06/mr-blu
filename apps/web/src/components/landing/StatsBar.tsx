import { useRef, useState, useEffect, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

interface Stat {
	value: string;
	label: string;
	suffix?: string;
}

interface StatsBarProps {
	stats?: Stat[];
}

const styles = {
	bar: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
		padding: 32,
		background: 'var(--white, #dbe8f4)',
		border: '1px solid var(--gray-200, #e2e8f0)',
		borderRadius: 20,
		flexWrap: 'wrap' as const,
	},
	statItem: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		textAlign: 'center' as const,
	},
	statValue: {
		fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
		fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		letterSpacing: '-0.02em',
		lineHeight: 1,
	},
	statLabel: {
		fontSize: 13,
		fontWeight: 500,
		color: 'var(--gray-500, #64748b)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		marginTop: 4,
	},
	divider: {
		width: 1,
		height: 40,
		background: 'var(--gray-200, #e2e8f0)',
		display: 'none',
	},
};

const STATS_CSS = `
@media (min-width: 640px) {
	.stats-bar-container {
		gap: 40px !important;
		padding: 40px 60px !important;
	}
	.stat-divider {
		display: block !important;
	}
}
`;

export function StatsBar({ stats: statsProp }: StatsBarProps) {
	const { t } = useI18nStore();
	const barRef = useRef<HTMLDivElement>(null);

	const defaultStats = useMemo(
		() => [
			{ value: '500', suffix: '+', label: t('landing.testimonials.stat1Label') },
			{ value: '5', suffix: ' hrs', label: t('landing.testimonials.stat2Label') },
			{ value: '10', suffix: 'k+', label: t('landing.testimonials.stat3Label') },
		],
		[t]
	);

	const stats = statsProp ?? defaultStats;
	const [displayValues, setDisplayValues] = useState<string[]>(stats.map(() => '0'));

	useEffect(() => {
		if (typeof window === 'undefined') return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				const node = barRef.current;
				if (!node) return;

				ScrollTrigger.create({
					trigger: node,
					start: 'top 85%',
					onEnter: () => {
						stats.forEach((stat, index) => {
							const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ''));

							gsap.to(
								{ val: 0 },
								{
									val: numericValue,
									duration: 1.5,
									ease: 'power2.out',
									delay: index * 0.2,
									onUpdate: function () {
										const current = this.targets()[0].val;
										setDisplayValues((prev) => {
											const next = [...prev];
											next[index] = Math.floor(current).toString();
											return next;
										});
									},
								}
							);
						});
					},
					once: true,
				});
			});
		});
	}, [stats]);

	return (
		<>
			<style>{STATS_CSS}</style>
			<div className="stats-bar-container" style={styles.bar} ref={barRef}>
				{stats.map((stat, i) => (
					<>
						<div key={stat.label} style={styles.statItem}>
							<span style={styles.statValue}>
								{displayValues[i]}
								{stat.suffix || ''}
							</span>
							<span style={styles.statLabel}>{stat.label}</span>
						</div>
						{i < stats.length - 1 && (
							<div className="stat-divider" style={styles.divider} />
						)}
					</>
				))}
			</div>
		</>
	);
}
