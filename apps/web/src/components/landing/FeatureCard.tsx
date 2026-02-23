import { useRef, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { LucideIcon } from '@/lib/types/lucide';
import './FeatureCard.css';

interface FeatureCardProps {
	title: string;
	description: string;
	icon: LucideIcon;
	size?: 'normal' | 'large' | 'wide';
	accent?: 'blue' | 'cyan' | 'green' | 'amber';
	children?: ComponentChildren;
}

const ACCENT_COLORS: Record<string, string> = {
	blue: 'var(--blu-primary, #0066FF)',
	cyan: 'var(--blu-accent-cyan, #0EA5E9)',
	green: 'var(--data-green, #10B981)',
	amber: 'var(--data-amber, #F59E0B)',
};

export function FeatureCard({
	title,
	description,
	icon: Icon,
	size = 'normal',
	accent = 'blue',
	children,
}: FeatureCardProps) {
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
			const rotateX = (y - centerY) / 15;
			const rotateY = (centerX - x) / 15;

			card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

			if (glare) {
				const glareX = (x / rect.width) * 100;
				const glareY = (y / rect.height) * 100;
				glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
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

	const sizeClass = size !== 'normal' ? `size-${size}` : '';
	const iconSize = size === 'large' ? 32 : 24;

	return (
		<div
			className={`feature-card ${sizeClass}`}
			style={{ '--accent': ACCENT_COLORS[accent] } as any}
			ref={cardRef}
		>
			<div className="card-glare" ref={glareRef} />
			<div className="card-icon">
				<Icon size={iconSize} strokeWidth={1.5} />
			</div>
			<div className="card-content">
				<h3 className="card-title">{title}</h3>
				<p className="card-description">{description}</p>
			</div>
			{children && <div className="card-extra">{children}</div>}
		</div>
	);
}
