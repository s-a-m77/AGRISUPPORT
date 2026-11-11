import { useTx } from '@/lib/i18n';
import { useEffect, useRef, type ReactNode } from 'react';
import fieldSensor from '@/assets/farmer-field-sensor.png.asset.json';
import cropCheck from '@/assets/farmer-crop-check.png.asset.json';
import connectedFarm from '@/assets/connected-farm.png.asset.json';
import fieldTeam from '@/assets/field-team-tablet.png.asset.json';

export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    const targets = element.querySelectorAll('[data-home-reveal]');
    targets.forEach(target => observer.observe(target));
    element.classList.add('home-motion-ready');
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className="home-motion space-y-16 pb-4">{children}</div>;
}

const photos = [
  { asset: fieldSensor, alt: 'Farmer checking a phone beside a solar-powered field sensor in a maize field', title: 'A closer connection to your field', label: 'FIELD INSIGHTS' },
  { asset: cropCheck, alt: 'Farmer inspecting crops while holding a mobile phone', title: 'Every crop. Every season.', label: 'CROP HEALTH' },
  { asset: connectedFarm, alt: 'Farmers using a phone to view agricultural information in a green field', title: 'Smarter decisions, together', label: 'CONNECTED FARMING' },
  { asset: fieldTeam, alt: 'Field team using a tablet and surveying equipment alongside farmers', title: 'From field to community', label: 'WORKING TOGETHER' },
];

export function HomePhotoGallery() {
  const tx = useTx();
  return (
    <section id="stories" aria-labelledby="farm-gallery-title" className="space-y-8 px-4 sm:px-6 md:px-8">
      <div data-home-reveal className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold tracking-wider text-landing-accent">{tx('AGRISENSE ETHIOPIA')}</p>
        <h2 id="farm-gallery-title" className="text-3xl md:text-4xl font-bold text-landing-ink">{tx('Rooted in the field.')}<br />{tx('Connected to the future.')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
        {photos.map(photo => (
          <figure key={photo.asset.asset_id} data-home-reveal className="home-photo group min-w-0 space-y-4">
            <div className="aspect-[16/10] overflow-hidden rounded-lg bg-landing-surface">
              <img src={photo.asset.url} alt={photo.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
            <figcaption className="space-y-1.5 px-1">
              <p className="text-[11px] font-semibold tracking-wider text-landing-accent">{tx(photo.label)}</p>
              <h3 className="text-xl md:text-2xl font-semibold text-landing-ink">{tx(photo.title)}</h3>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}