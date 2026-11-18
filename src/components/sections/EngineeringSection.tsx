import { GlassPanel } from '../ui/GlassPanel';

const steps = [
  { icon: '📡', title: 'Data Collection', desc: 'Thousands of IoT sensors monitor traffic flow, air quality, energy consumption, temperature and water usage every second across the city.', color: '#22d3ee' },
  { icon: '🧠', title: 'AI Analysis', desc: 'Machine learning algorithms analyse sensor data in real time, detect patterns, predict demand, and generate optimisation recommendations.', color: '#a855f7' },
  { icon: '⚡', title: 'Smart Grid Response', desc: 'The smart microgrid automatically balances electricity generation and consumption, activating battery storage or reducing non-essential loads when needed.', color: '#f59e0b' },
  { icon: '🚌', title: 'Transport Coordination', desc: 'Buses, trams, autonomous shuttles and cycling signals are coordinated in real time using live occupancy and demand data, minimising waiting times.', color: '#3b82f6' },
  { icon: '👷', title: 'Human Oversight', desc: 'City operators monitor all systems through a central dashboard and retain full authority to override AI recommendations. Technology supports — but never replaces — human judgement.', color: '#22c55e' },
];

export function EngineeringSection() {
  return (
    <section id="engineering" className="py-20 px-4" style={{ background: '#132016' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest mb-3" style={{ color: '#8fbb91' }}>SYSTEM ARCHITECTURE</p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">How the City <span style={{ color: '#8fbb91' }}>Thinks</span></h2>
          <p style={{ color: 'rgba(220,240,220,0.5)', maxWidth: 540, margin: '0 auto', fontSize: 15 }}>Five layers of intelligent infrastructure work together to keep Smart City 2050 running smoothly, safely and sustainably.</p>
        </div>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-8 bottom-8 w-px hidden md:block" style={{ background: 'linear-gradient(180deg, rgba(143,187,145,0.15), rgba(143,187,145,0.6), rgba(143,187,145,0.15))' }} />
          <div className="flex flex-col gap-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl z-10" style={{ background: `${s.color}18`, border: `1px solid ${s.color}44` }}>{s.icon}</div>
                <GlassPanel className="flex-1">
                  <h3 className="font-display font-bold text-base mb-2" style={{ color: s.color }}>{String(i + 1).padStart(2, '0')} — {s.title}</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{s.desc}</p>
                </GlassPanel>
              </div>
            ))}
          </div>
        </div>
        {/* Vocabulary box */}
        <GlassPanel className="mt-10">
          <h3 className="font-display font-bold text-sm mb-4" style={{ color: '#8fbb91' }}>📖 KEY VOCABULARY (B2–C1)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ['Smart grid', 'An electricity network that uses digital technology to balance supply and demand automatically.'],
              ['BIPV', 'Building-Integrated Photovoltaics — solar cells built directly into walls or windows.'],
              ['IoT sensor', 'A small device connected to the internet that measures real-world data like temperature or traffic.'],
              ['Microgrid', 'A small local electricity network that can operate independently from the main grid.'],
              ['Autonomous', 'Operating without direct human control, guided by AI and sensors.'],
              ['Superblock', 'An urban design that closes streets to through traffic, creating safe, green pedestrian zones.'],
            ].map(([term, def]) => (
              <div key={term} className="p-3 rounded-lg" style={{ background: 'rgba(143,187,145,0.05)', border: '1px solid rgba(143,187,145,0.1)' }}>
                <div className="font-semibold text-xs mb-1" style={{ color: '#8fbb91' }}>{term}</div>
                <div className="text-xs" style={{ color: 'rgba(220,240,220,0.55)', lineHeight: 1.5 }}>{def}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
