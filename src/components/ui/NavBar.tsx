import { useState } from 'react';
interface Props {
  onSection: (s: string) => void;
  onPresentation: () => void;
}
export function NavBar({ onSection, onPresentation }: Props) {
  const [open, setOpen] = useState(false);
  const links = [
    { id: 'city', label: 'City' },
    { id: 'districts', label: 'Districts' },
    { id: 'engineering', label: 'How It Works' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'quiz', label: '🎯 Quiz' },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
      style={{ background: 'rgba(13,26,15,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(143,187,145,0.12)' }}>
      <span className="font-display font-black text-lg" style={{ color: '#8fbb91', letterSpacing: '0.2em' }}>
        SMART CITY <span style={{ color: '#fff' }}>2050</span>
      </span>
      <div className="hidden md:flex gap-6">
        {links.map(l => (
          <button key={l.id} onClick={() => onSection(l.id)}
            className="text-sm font-medium transition-colors"
            style={{ color: 'rgba(220,240,220,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#b5d6b7')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,240,220,0.7)')}
          >{l.label}</button>
        ))}
        <button onClick={onPresentation}
          className="px-4 py-1 rounded-full text-sm font-semibold transition-all"
          style={{ background: 'rgba(143,187,145,0.12)', border: '1px solid rgba(143,187,145,0.4)', color: '#8fbb91', cursor: 'pointer' }}>
          Present
        </button>
      </div>
      <button className="md:hidden text-white" onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>☰</button>
      {open && (
        <div className="absolute top-full left-0 right-0 py-4 flex flex-col gap-3 px-6"
          style={{ background: 'rgba(13,26,15,0.97)', borderBottom: '1px solid rgba(143,187,145,0.12)' }}>
          {links.map(l => (
            <button key={l.id} onClick={() => { onSection(l.id); setOpen(false); }}
              className="text-sm font-medium text-left"
              style={{ color: 'rgba(220,240,220,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>{l.label}</button>
          ))}
          <button onClick={() => { onPresentation(); setOpen(false); }}
            className="text-sm font-semibold text-left"
            style={{ color: '#8fbb91', background: 'none', border: 'none', cursor: 'pointer' }}>🎤 Present</button>
        </div>
      )}
    </nav>
  );
}
