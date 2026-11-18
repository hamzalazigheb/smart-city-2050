import type { District } from '../../data/districts';
import { GlassPanel } from '../ui/GlassPanel';

interface Props {
  district: District | null;
  onClose: () => void;
}
export function DistrictPanel({ district, onClose }: Props) {
  if (!district) return null;
  return (
    <div className="fixed right-4 top-20 bottom-4 w-80 z-30 overflow-y-auto" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
      <GlassPanel className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-base" style={{ color: district.color }}>{district.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{district.description}</p>
        <div>
          <h3 className="text-xs tracking-widest mb-2" style={{ color: district.color }}>KEY FEATURES</h3>
          <ul className="flex flex-col gap-1">
            {district.features.map(f => (
              <li key={f} className="text-xs flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}><span style={{ color: district.color }}>▸</span>{f}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg" style={{ background: `${district.color}10`, border: `1px solid ${district.color}30` }}>
          <h3 className="text-xs tracking-widest mb-2" style={{ color: district.color }}>ENGINEERING</h3>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{district.engineering}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {district.stats.map(s => (
            <div key={s.label} className="p-2 rounded text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="font-display font-bold text-sm" style={{ color: district.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-xs tracking-widest mb-2" style={{ color: '#22c55e' }}>BENEFITS</h3>
          {district.benefits.map(b => <p key={b} className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>✓ {b}</p>)}
        </div>
        <div>
          <h3 className="text-xs tracking-widest mb-2" style={{ color: '#ef4444' }}>LIMITATIONS</h3>
          {district.limitations.map(l => <p key={l} className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>⚠ {l}</p>)}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>All statistics are fictional design targets for this academic project.</p>
      </GlassPanel>
    </div>
  );
}
