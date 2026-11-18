import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { metrics } from '../../data/dashboardMetrics';
import { GlassPanel } from '../ui/GlassPanel';

function MetricCard({ metric, index }: { metric: typeof metrics[0]; index: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: metric.value,
      duration: 2,
      delay: index * 0.2,
      ease: 'power2.out',
      onUpdate() {
        if (numRef.current) numRef.current.textContent = Math.round(obj.val).toString();
      },
    });
    gsap.to(barRef.current, { width: `${metric.value}%`, duration: 2, delay: index * 0.2, ease: 'power2.out' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <GlassPanel className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{metric.label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(143,187,145,0.12)', color: '#8fbb91' }}>{metric.target}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span ref={numRef} className="font-display font-black text-5xl" style={{ color: metric.color }}>0</span>
        <span className="font-display text-2xl" style={{ color: metric.color }}>{metric.unit}</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div ref={barRef} className="h-full rounded-full" style={{ width: 0, background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)` }} />
      </div>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{metric.description}</p>
    </GlassPanel>
  );
}

export function Dashboard() {
  return (
    <section id="dashboard" className="min-h-screen py-20 px-4" style={{ background: 'linear-gradient(180deg, #0d1a0f 0%, #132016 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest mb-3" style={{ color: '#8fbb91' }}>PERFORMANCE TARGETS</p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">City <span style={{ color: '#8fbb91' }}>Dashboard</span></h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto' }}>All figures are <strong style={{ color: '#f59e0b' }}>fictional design targets</strong> for this academic project — not measured real-world results.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((m, i) => <MetricCard key={m.id} metric={m} index={i} />)}
        </div>
        {/* Problems vs Solutions table */}
        <GlassPanel className="overflow-auto">
          <h3 className="font-display font-bold text-lg text-white mb-6">Problems <span style={{ color: '#8fbb91' }}>→</span> Solutions</h3>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(143,187,145,0.18)' }}>
                {['Urban Problem', 'Engineering Solution', 'Technology Used', 'Expected Impact'].map(h => (
                  <th key={h} className="text-left py-2 pr-6" style={{ color: '#8fbb91', fontSize: 11, letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Traffic Congestion', 'AI traffic signals + EV shuttles', 'Machine learning, IoT sensors', 'Up to 40% less congestion*'],
                ['Air Pollution', 'Zero-emission transport + green corridors', 'EVs, HEPA sensors, trees', 'Significant PM2.5 reduction*'],
                ['High Energy Use', 'Solar, wind, smart grid', 'BIPV, batteries, AI grid', '100% renewable ambition*'],
                ['Inequality', '15-min city + affordable housing', 'Universal design, mixed-use zoning', '40% affordable units target*'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {row.map((cell, j) => (
                    <td key={j} className="py-3 pr-6" style={{ color: j === 0 ? '#ef4444' : j === 3 ? '#22c55e' : 'rgba(255,255,255,0.7)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>* All figures marked with * are fictional design targets for this academic project.</p>
        </GlassPanel>
      </div>
    </section>
  );
}
