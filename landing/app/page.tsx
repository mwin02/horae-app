import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Manifesto } from '@/components/Manifesto';
import { SectionFeatures } from '@/components/SectionFeatures';
import { PrivacyBand } from '@/components/PrivacyBand';
import { FinalCTA } from '@/components/FinalCTA';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <Manifesto />
      <SectionFeatures />
      <PrivacyBand />
      <FinalCTA />
      <Footer />
    </main>
  );
}
