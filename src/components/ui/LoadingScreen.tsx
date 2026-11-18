import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const ref  = useRef<HTMLDivElement>(null);
  const prog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tl = gsap.timeline();
    tl.to(prog.current, { width: '100%', duration: 2, ease: 'power2.inOut' })
      .to(ref.current,  { opacity: 0, duration: 0.5, onComplete });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#0d1a0f' }}>
      <div className="font-display text-4xl font-black text-glow mb-2"
        style={{ color: '#8fbb91', letterSpacing: '0.3em' }}>SMART CITY</div>
      <div className="font-display text-6xl font-black text-glow mb-8"
        style={{ color: '#ffffff' }}>2050</div>
      <div className="w-64 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(143,187,145,0.15)' }}>
        <div ref={prog} className="h-full rounded-full"
          style={{ width: 0, background: 'linear-gradient(90deg, #6faa72, #b5d6b7)' }} />
      </div>
      <p className="mt-4 text-xs tracking-widest"
        style={{ color: 'rgba(143,187,145,0.55)' }}>LOADING CITY SYSTEMS…</p>
    </div>
  );
}
