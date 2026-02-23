import { useRef, useEffect, useMemo } from 'preact/hooks';
import { Star, Quote } from 'lucide-react';
import { StatsBar } from './StatsBar';
import { SectionWrapper } from './SectionWrapper';
import { useI18nStore } from '@/lib/i18n';

const styles = {
	container: {
		width: '100%',
		maxWidth: 800,
		margin: '0 auto',
	},
	header: {
		textAlign: 'center' as const,
		marginBottom: 48,
	},
	title: {
		fontFamily: 'var(--font-display)',
		fontSize: 'clamp(2rem, 5vw, 3rem)',
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		margin: 0,
		letterSpacing: '-0.02em',
	},
	statsContainer: {
		marginBottom: 40,
	},
	card: {
		background: 'var(--white, #dbe8f4)',
		border: '1px solid var(--gray-200, #e2e8f0)',
		borderRadius: 24,
		padding: '40px',
		textAlign: 'center' as const,
		position: 'relative' as const,
	},
	quoteIcon: {
		color: 'var(--blu-primary, #0066ff)',
		opacity: 0.2,
		marginBottom: 24,
	},
	quoteText: {
		fontFamily: 'var(--font-body)',
		fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
		fontWeight: 400,
		lineHeight: 1.7,
		color: 'var(--gray-700, #334155)',
		margin: '0 0 32px 0',
		fontStyle: 'italic' as const,
	},
	author: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		gap: 12,
	},
	avatar: {
		width: 48,
		height: 48,
		background: 'linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%)',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 24,
	},
	authorInfo: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
	},
	authorName: {
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		fontSize: 15,
	},
	authorRole: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
	},
	rating: {
		display: 'flex',
		gap: 2,
	},
};

const TESTIMONIAL_CSS = `
@media (min-width: 640px) {
	.testimonial-card-inner {
		padding: 48px 60px !important;
	}
}
@media (min-width: 480px) {
	.testimonial-author {
		flex-direction: row !important;
		justify-content: center;
		gap: 16px !important;
	}
	.testimonial-author-info {
		align-items: flex-start !important;
	}
}
@media (prefers-reduced-motion: reduce) {
	.testimonial-stats-container,
	.testimonial-card-inner {
		opacity: 1 !important;
	}
}
`;

export function TestimonialsSection() {
	const { t } = useI18nStore();
	const sectionRef = useRef<HTMLDivElement>(null);

	const testimonial = useMemo(
		() => ({
			quote: t('landing.testimonials.quote'),
			author: t('landing.testimonials.author'),
			role: t('landing.testimonials.role'),
			avatar: '\u{1F477}',
			rating: 5,
		}),
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
						gsap.fromTo(
							node.querySelector('.testimonial-stats-container'),
							{ y: 30, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
						);
						gsap.fromTo(
							node.querySelector('.testimonial-card-inner'),
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 }
						);
					},
					once: true,
				});
			});
		});
	}, []);

	return (
		<SectionWrapper id="testimonials" background="gray">
			<style>{TESTIMONIAL_CSS}</style>
			<div style={styles.container} ref={sectionRef}>
				<div style={styles.header}>
					<h2 style={styles.title}>{t('landing.testimonials.title')}</h2>
				</div>

				<div className="testimonial-stats-container" style={styles.statsContainer}>
					<StatsBar />
				</div>

				<div className="testimonial-card-inner" style={styles.card}>
					<div style={styles.quoteIcon}>
						<Quote size={32} strokeWidth={1.5} />
					</div>
					<blockquote style={styles.quoteText}>{testimonial.quote}</blockquote>
					<div className="testimonial-author" style={styles.author}>
						<div style={styles.avatar}>{testimonial.avatar}</div>
						<div className="testimonial-author-info" style={styles.authorInfo}>
							<span style={styles.authorName}>{testimonial.author}</span>
							<span style={styles.authorRole}>{testimonial.role}</span>
						</div>
						<div style={styles.rating}>
							{Array.from({ length: testimonial.rating }).map((_, i) => (
								<Star
									key={i}
									size={16}
									fill="var(--data-amber, #F59E0B)"
									stroke="var(--data-amber, #F59E0B)"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</SectionWrapper>
	);
}
