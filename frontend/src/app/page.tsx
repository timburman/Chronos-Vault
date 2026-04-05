import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import WhatSection from '@/components/landing/WhatSection';
import HowItWorks from '@/components/landing/HowItWorks';
import WhenSection from '@/components/landing/WhenSection';
import WhySection from '@/components/landing/WhySection';
import OpenSourceSection from '@/components/landing/OpenSourceSection';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <Hero />
      <WhatSection />
      <HowItWorks />
      <WhenSection />
      <WhySection />
      <OpenSourceSection />
    </div>
  );
}
