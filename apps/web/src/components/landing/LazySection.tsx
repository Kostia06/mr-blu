import { useRef, useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface LazySectionProps {
	children: ComponentChildren;
	rootMargin?: string;
}

export function LazySection({ children, rootMargin = '200px' }: LazySectionProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const node = containerRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin }
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [rootMargin]);

	const style: Record<string, string | number> = visible
		? {}
		: {
				minHeight: '60vh',
				contentVisibility: 'auto',
				containIntrinsicSize: 'auto 60vh',
			};

	return (
		<div ref={containerRef} style={style}>
			{visible ? children : null}
		</div>
	);
}
