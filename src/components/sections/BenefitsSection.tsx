import { GlassPanel } from '../ui/GlassPanel';

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 px-4" style={{ background: '#0d1a0f' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest mb-3" style={{ color: '#8fbb91' }}>HONEST ASSESSMENT</p>
          <h2 className="font-display font-black text-4xl text-white mb-4">Benefits & <span style={{ color: '#f97316' }}>Limitations</span></h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto', fontSize: 15 }}>Technology is powerful — but it is not a perfect solution. We must be honest about the trade-offs.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <GlassPanel>
            <h3 className="font-display font-bold text-base mb-4" style={{ color: '#22c55e' }}>✅ Benefits</h3>
            <ul className="flex flex-col gap-2">
              {['Cleaner air and reduced carbon emissions','Safer, faster and cheaper mobility','Lower household energy bills','Greater equality in access to services','Improved public health and mental well-being','Resilient infrastructure during extreme weather'].map(b => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#22c55e', marginTop: 2 }}>▸</span>{b}</li>
              ))}
            </ul>
          </GlassPanel>
          <GlassPanel>
            <h3 className="font-display font-bold text-base mb-4" style={{ color: '#ef4444' }}>⚠️ Limitations & Risks</h3>
            <ul className="flex flex-col gap-2">
              {['Billions of euros in upfront investment required','Cybersecurity: connected systems are vulnerable to attacks','Digital exclusion for elderly or low-income residents','Environmental cost of manufacturing technology','Battery storage degrades and requires rare minerals','Risk of over-reliance on AI without human oversight'].map(l => (
                <li key={l} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#ef4444', marginTop: 2 }}>▸</span>{l}</li>
              ))}
            </ul>
          </GlassPanel>
        </div>
        {/* Accessibility deep dive */}
        <GlassPanel className="mt-6">
          <h3 className="font-display font-bold text-base mb-4" style={{ color: '#3b82f6' }}>♿ Accessibility by Design</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Step-free infrastructure', 'All stations, public buildings and parks are fully accessible with ramps and lifts.'],
              ['Tactile paving', 'Raised tactile surfaces guide people with visual impairments along all footpaths.'],
              ['Audio signals', 'All pedestrian crossings have audible signals and countdown timers.'],
              ['Affordable transport', 'Public transport is subsidised to ensure access for all income levels.'],
              ['15-minute services', 'Hospitals, schools, supermarkets and parks are all within a 15-minute walk.'],
              ['Multilingual information', 'All signage, apps and announcements are available in multiple languages.'],
            ].map(([title, desc]) => (
              <div key={title} className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div className="font-semibold text-xs mb-1" style={{ color: '#3b82f6' }}>{title}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
