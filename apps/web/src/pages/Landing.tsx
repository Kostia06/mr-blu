import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { BackgroundBlobs } from '@/components/landing/BackgroundBlobs'
import { GridBackground } from '@/components/landing/GridBackground'
import { NoiseOverlay } from '@/components/landing/NoiseOverlay'

export function LandingPage() {
  return (
    <>
      <BackgroundBlobs variant="full" intensity="normal" />
      <GridBackground opacity={0.3} size={60} fade />
      <NoiseOverlay opacity={0.03} />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  )
}
