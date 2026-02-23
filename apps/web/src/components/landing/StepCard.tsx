import { useRef, useEffect } from 'preact/hooks';
import type { LucideIcon } from '@/lib/types/lucide';

interface StepCardProps {
	step: number;
	title: string;
	description: string;
	icon: LucideIcon;
}

const styles = {
	card: {
		position: 'relative' as const,
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		textAlign: 'center' as const,
		padding: '40px 28px',
		background: 'var(--white, #dbe8f4)',
		border: '1px solid var(--gray-200, #e2e8f0)',
		borderRadius: 24,
		transition: 'transform 0.15s ease-out, box-shadow 0.4s ease, border-color 0.3s ease',
		transformStyle: 'preserve-3d' as const,
		willChange: 'transform',
		overflow: 'visible' as const,
		width: '100%',
		maxWidth: 340,
	},
	glare: {
		position: 'absolute' as const,
		inset: 0,
		pointerEvents: 'none' as const,
		borderRadius: 20,
		zIndex: 0,
	},
	stepNumber: {
		position: 'absolute' as const,
		top: -12,
		left: '50%',
		transform: 'translateX(-50%)',
		width: 24,
		height: 24,
		background: 'linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%)',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
		boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
		transition: 'transform 0.3s ease, box-shadow 0.3s ease',
	},
	stepNumberText: {
		fontSize: 12,
		fontWeight: 700,
		color: 'white',
	},
	icon: {
		position: 'relative' as const,
		zIndex: 1,
		width: 64,
		height: 64,
		background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(14, 165, 233, 0.08) 100%)',
		borderRadius: 16,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: 'var(--blu-primary, #0066ff)',
		marginBottom: 20,
		transition: 'transform 0.3s ease',
	},
	title: {
		position: 'relative' as const,
		zIndex: 1,
		fontFamily: 'var(--font-display)',
		fontSize: 20,
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		margin: '0 0 8px 0',
		letterSpacing: '-0.01em',
	},
	description: {
		position: 'relative' as const,
		zIndex: 1,
		fontSize: 15,
		lineHeight: 1.6,
		color: 'var(--gray-600, #475569)',
		margin: 0,
		maxWidth: 300,
	},
};

export function StepCard({ step, title, description, icon: Icon }: StepCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const glareRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const isTouchDevice = 'ontouchstart' in window;
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (isTouchDevice || prefersReducedMotion) return;

		const card = cardRef.current;
		const glare = glareRef.current;
		if (!card) return;

		function handleMouseMove(e: MouseEvent) {
			if (!card) return;
			const rect = card.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;
			const rotateX = (y - centerY) / 12;
			const rotateY = (centerX - x) / 12;

			card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

			if (glare) {
				const glareX = (x / rect.width) * 100;
				const glareY = (y / rect.height) * 100;
				glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, transparent 50%)`;
			}
		}

		function handleMouseLeave() {
			if (card) {
				card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
			}
			if (glare) {
				glare.style.background = 'transparent';
			}
		}

		card.addEventListener('mousemove', handleMouseMove);
		card.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			card.removeEventListener('mousemove', handleMouseMove);
			card.removeEventListener('mouseleave', handleMouseLeave);
		};
	}, []);

	return (
		<div className="step-card" ref={cardRef} style={styles.card}>
			<div ref={glareRef} style={styles.glare} />
			<div style={styles.stepNumber}>
				<span style={styles.stepNumberText}>{step}</span>
			</div>
			<div style={styles.icon}>
				<Icon size={28} strokeWidth={1.5} />
			</div>
			<h3 style={styles.title}>{title}</h3>
			<p style={styles.description}>{description}</p>
		</div>
	);
}
