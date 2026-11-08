import { existsSync } from 'node:fs';
import path from 'node:path';
import ConstructionSection from '@/components/construction/ConstructionSection';
import Contact from '@/components/landing/Contact';
import Gallery from '@/components/landing/Gallery';
import Navbar from '@/components/landing/Navbar';
import { About, Apartments, Architecture, Footer, Location } from '@/components/landing/Sections';

/** Optional opening photograph: drop a file at public/hero/hero.jpg to use it. */
const HERO_FILE = path.join(process.cwd(), 'public', 'hero', 'hero.jpg');

export default function Page() {
  const heroImage = existsSync(HERO_FILE) ? '/hero/hero.jpg' : undefined;
  return (
    <div className="bg-ink-900 font-body text-bone-50">
      <Navbar />
      <ConstructionSection heroImage={heroImage} />
      <main id="main" tabIndex={-1}>
        <About />
        <Architecture />
        <Gallery />
        <Apartments />
        <Location />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
