import { useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { slides } from '../../data/presentationSlides';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Props { onClose: () => void; }

export function PresentationMode({ onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const reduced = useReducedMotion();
  const slide = slides[current];

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= slides.length) return;
    if (!reduced) {
      gsap.fromTo('.slide-content', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 });
    }
    setCurrent(idx);
  }, [reduced]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, goTo, onClose]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'radial-gradient(ellipse at 30% 30%, #1c2e1f 0%, #0d1a0f 70%)' }}>
      {/* Grid bg */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(143,187,145,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(143,187,145,0.025) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 z-10" style={{ borderBottom: '1px solid rgba(143,187,145,0.12)' }}>
        <span className="font-display font-black text-sm" style={{ color: '#8fbb91', letterSpacing: '0.2em' }}>SMART CITY 2050</span>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNotes(!showNotes)} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(143,187,145,0.09)', border: '1px solid rgba(143,187,145,0.25)', color: '#8fbb91', cursor: 'pointer' }}>{showNotes ? 'Hide' : 'Show'} Notes</button>
          <button onClick={onClose} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>✕ Exit</button>
        </div>
      </div>
      {/* Progress */}
      <div className="flex gap-1 px-6 py-2 z-10">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className="flex-1 h-1 rounded-full transition-all" style={{ background: i === current ? slide.accentColor : 'rgba(255,255,255,0.1)', cursor: 'pointer', border: 'none' }} />
        ))}
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 z-10">
        <div className="slide-content w-full max-w-4xl">
          {/* Speaker badge */}
          <div className="flex items-center gap-3 mb-6">
            {(slide.speaker === 1 || slide.speaker === 'both') && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }}>🎤 Speaker 1</span>
            )}
            {(slide.speaker === 2 || slide.speaker === 'both') && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>🎤 Speaker 2</span>
            )}
            <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{current + 1} / {slides.length}</span>
          </div>
          {/* Title */}
          <h1 className="font-display font-black mb-3" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', color: '#fff', lineHeight: 1.1 }}>
            {slide.title}
          </h1>
          {slide.subtitle && <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)' }}>{slide.subtitle}</p>}
          <ul className="flex flex-col gap-3">
            {slide.bodyText.map((line, i) => (
              <li key={i} className="flex items-start gap-3 text-base" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                <span style={{ color: slide.accentColor, marginTop: 3, flexShrink: 0 }}>▸</span>{line}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Speaker notes */}
      {showNotes && (
        <div className="px-6 py-4 z-10" style={{ borderTop: '1px solid rgba(143,187,145,0.12)', background: 'rgba(0,0,0,0.45)', maxHeight: '30vh', overflowY: 'auto' }}>
          <p className="text-xs mb-1" style={{ color: '#8fbb91', letterSpacing: '0.1em' }}>SPEAKER NOTES</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{slide.speakerNotes}</p>
        </div>
      )}
      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 z-10" style={{ borderTop: '1px solid rgba(143,187,145,0.1)' }}>
        <button onClick={() => goTo(current - 1)} disabled={current === 0} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all" style={{ background: current === 0 ? 'transparent' : 'rgba(143,187,145,0.09)', border: `1px solid ${current === 0 ? 'transparent' : 'rgba(143,187,145,0.25)'}`, color: current === 0 ? 'rgba(255,255,255,0.2)' : '#8fbb91', cursor: current === 0 ? 'default' : 'pointer' }}>← Previous</button>
        <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>← → Arrow Keys  |  Esc to Exit</span>
        {current < slides.length - 1 ? (
          <button onClick={() => goTo(current + 1)} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: `${slide.accentColor}18`, border: `1px solid ${slide.accentColor}44`, color: slide.accentColor, cursor: 'pointer' }}>Next →</button>
        ) : (
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>Finish ✓</button>
        )}
      </div>
    </div>
  );
}
