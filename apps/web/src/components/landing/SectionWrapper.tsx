import { useRef, useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface SectionWrapperProps {
	id?: string;
	className?: string;
	background?: 'white' | 'gray' | 'gradient' | 'dark';
	padding?: 'default' | 'large' | 'none';
	maxWidth?: 'default' | 'wide' | 'full';
	reveal?: boolean;
	children: ComponentChildren;
}

const bgStyles: Record<string, Record<string, string>> = {
	white: { background: 'rgba(219, 232, 244, 0.85)' },
	gray: { background: 'rgba(248, 250, 252, 0.8)' },
	gradient: { background: 'linear-gradient(180deg, rgba(219, 232, 244, 0.85) 0%, rgba(248, 250, 252, 0.8) 100%)' },
	dark: { background: '#1D1D1F' },
};

const maxWidthValues: Record<string, string> = {
	default: '1280px',
	wide: '1440px',
	full: 'none',
};

export function SectionWrapper({
	id,
	className = '',
	background = 'white',
	padding = 'default',
	maxWidth = 'default',
	reveal = true,
	children,
}: SectionWrapperProps) {
	const sectionRef = useRef<HTMLElement>(null);
	const [revealed, setRevealed] = useState(!reveal);

	useEffect(() => {
		if (typeof window === 'undefined' || !reveal) {
			setRevealed(true);
			return;
		}

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) {
			setRevealed(true);
			return;
		}

		const node = sectionRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setRevealed(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '0px 0px -15% 0px' }
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [reveal]);

	const paddingValue = padding === 'large' ? '120px 24px' : padding === 'none' ? '0 24px' : '80px 24px';

	const sectionStyle: Record<string, string | number> = {
		position: 'relative',
		width: '100%',
		opacity: revealed ? 1 : 0,
		transform: revealed ? 'translateY(0)' : 'translateY(40px)',
		transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
		padding: paddingValue,
		...bgStyles[background],
	};

	const contentStyle: Record<string, string | number> = {
		width: '100%',
		margin: '0 auto',
		maxWidth: maxWidthValues[maxWidth],
	};

	return (
		<section id={id} ref={sectionRef} className={className} style={sectionStyle}>
			<div style={contentStyle}>{children}</div>
		</section>
	);
}
