import { useEffect } from 'preact/hooks';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export function LandingPage() {
	useEffect(() => {
		document.documentElement.classList.add('landing');
		document.body.classList.add('landing');
		return () => {
			document.documentElement.classList.remove('landing');
			document.body.classList.remove('landing');
		};
	}, []);

	return (
		<div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
			<Navbar />
			<HeroSection />
			<HowItWorksSection />
			<CTASection />
			<Footer />
		</div>
	);
}
