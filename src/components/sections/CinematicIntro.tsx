import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
interface Props { onComplete: () => void; }
export function CinematicIntro({ onComplete }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const title1 = useRef<HTMLDivElement>(null);
  const title2 = useRef<HTMLDivElement>(null);
  const subtitle = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { onComplete(); return; }
    const tl = gsap.timeline({ delay: 0.5 });
    tl.from(title1.current, { opacity: 0, y: 60, duration: 1.2, ease: 'power3.out' })
      .from(title2.current, { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, '-=0.6')
      .from(subtitle.current, { opacity: 0, y: 20, duration: 0.8, ease: 'power2.out' }, '-=0.4')
      .to({}, { duration: 1.5 })
      .to(container.current, { opacity: 0, duration: 0.8, onComplete });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  return (
    <div ref={container} className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #132016 0%, #0d1a0f 70%)' }}>
      {/* Subtle grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(143,187,145,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(143,187,145,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Animated rings */}
      <div className="absolute" style={{ width: 600, height: 600, border: '1px solid rgba(143,187,145,0.09)', borderRadius: '50%', animation: 'pulse 4s ease-in-out infinite' }} />
      <div className="absolute" style={{ width: 400, height: 400, border: '1px solid rgba(143,187,145,0.14)', borderRadius: '50%', animation: 'pulse 3s ease-in-out infinite 1s' }} />
      <div className="relative z-10 text-center px-4">
        <div ref={title1} className="font-display font-black mb-2" style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)', letterSpacing: '0.5em', color: 'rgba(143,187,145,0.75)' }}>WELCOME TO</div>
        <div ref={title2} className="font-display font-black text-glow" style={{ fontSize: 'clamp(3rem, 12vw, 8rem)', letterSpacing: '0.1em', color: '#ffffff', lineHeight: 1 }}>SMART CITY<br /><span style={{ color: '#8fbb91' }}>2050</span></div>
        <div ref={subtitle} className="mt-6 font-body" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', color: 'rgba(220,240,220,0.65)', maxWidth: 500, margin: '1.5rem auto 0' }}>Designing the City of the Future</div>
      </div>
      <button onClick={onComplete} className="absolute bottom-8 right-8 text-xs tracking-widest px-4 py-2 rounded-full transition-all hover:opacity-100" style={{ opacity: 0.5, background: 'rgba(143,187,145,0.08)', border: '1px solid rgba(143,187,145,0.22)', color: '#8fbb91', cursor: 'pointer' }}>SKIP INTRO →</button>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
