import { useRef, useEffect } from 'preact/hooks';
import { HeroHeadline } from './HeroHeadline';
import { HeroPhone } from './HeroPhone';
import { BetaSignupForm } from './BetaSignupForm';

export function HeroSection() {
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const node = sectionRef.current;
		if (!node) return;

		if (prefersReducedMotion) {
			node.querySelectorAll<HTMLElement>('.hero-animate').forEach((el) => {
				el.style.opacity = '1';
				el.style.transform = 'none';
			});
			return;
		}

		import('gsap').then(({ gsap }) => {
			const phone = node.querySelector('.hero-phone-wrap');
			const signup = node.querySelector('.hero-signup');

			if (phone) {
				gsap.to(phone, {
					y: 0,
					opacity: 1,
					duration: 0.8,
					ease: 'power3.out',
					delay: 0.6,
				});
			}

			if (signup) {
				gsap.to(signup, {
					opacity: 1,
					duration: 0.5,
					ease: 'power2.out',
					delay: 1,
				});
			}
		});
	}, []);

	return (
		<section
			className="relative flex items-center justify-center pt-[100px] px-6 pb-16 bg-white overflow-x-clip"
			id="main-content"
			ref={sectionRef}
		>
			<div className="w-full max-w-[480px] mx-auto flex flex-col items-center gap-6">
				<HeroHeadline />

				<div className="hero-animate hero-phone-wrap opacity-0 translate-y-[30px]">
					<HeroPhone />
				</div>

				<div className="hero-animate opacity-0 w-full">
					<BetaSignupForm />
				</div>
			</div>
		</section>
	);
}
