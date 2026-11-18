import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { NavBar } from './components/ui/NavBar';
import { CinematicIntro } from './components/sections/CinematicIntro';
import { Dashboard } from './components/sections/Dashboard';
import { EngineeringSection } from './components/sections/EngineeringSection';
import { BenefitsSection } from './components/sections/BenefitsSection';
import { PresentationMode } from './components/sections/PresentationMode';
import { DistrictPanel } from './components/city/DistrictPanel';
import { districts, type District } from './data/districts';
import { GlassPanel } from './components/ui/GlassPanel';
import { QuizSection } from './components/sections/QuizSection';
import { SceneErrorBoundary } from './components/city/SceneErrorBoundary';
import type { CameraView } from './components/city/CameraRig';
import { useReducedMotion } from './hooks/useReducedMotion';

// Lazy-load heavy 3D component
const CityScene = lazy(() => import('./components/city/CityScene').then(m => ({ default: m.CityScene })));

type AppState = 'loading' | 'intro' | 'main';

const CAMERA_VIEWS: { id: CameraView; label: string }[] = [
  { id: 'aerial', label: 'Aerial' },
  { id: 'street', label: 'Street' },
  { id: 'district', label: 'District' },
  { id: 'monorail', label: 'Ride Monorail' },
];

export default function App() {
  const [state, setState] = useState<AppState>('loading');
  const [showPresentation, setShowPresentation] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [view, setView] = useState<CameraView>('aerial');
  const [cityVisible, setCityVisible] = useState(true);
  const citySection = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const quality = useMemo(
    () => (window.matchMedia('(max-width: 768px), (pointer: coarse)').matches ? 'low' : 'high'),
    [],
  );

  useEffect(() => {
    const section = citySection.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setCityVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [state, showPresentation]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const focusDistrict = (d: District) => {
    setSelectedDistrict(d);
    setView('district');
  };

  const changeView = (next: CameraView) => {
    if (next === 'district' && !selectedDistrict) setSelectedDistrict(districts[0]);
    setView(next);
  };

  if (state === 'loading') return <LoadingScreen onComplete={() => setState('intro')} />;
  if (showPresentation) return <PresentationMode onClose={() => setShowPresentation(false)} />;

  return (
    <div className="min-h-screen" style={{ background: '#0d1a0f' }}>
      {state === 'intro' && <CinematicIntro onComplete={() => setState('main')} />}
      <NavBar onSection={scrollTo} onPresentation={() => setShowPresentation(true)} />

      {/* HERO / CITY SECTION */}
      <section ref={citySection} id="city" style={{ height: '100vh', paddingTop: 56, position: 'relative' }}>
        <div style={{ width: '100%', height: 'calc(100vh - 56px)' }}>
          <SceneErrorBoundary>
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#0d1a0f' }}>
                <span className="font-display text-sm tracking-widest" style={{ color: '#8fbb91' }}>RENDERING CITY…</span>
              </div>
            }>
              <CityScene
                onDistrictSelect={focusDistrict}
                onControlCentre={() => scrollTo('engineering')}
                selectedDistrict={selectedDistrict}
                view={view}
                ready={state === 'main'}
                active={cityVisible}
                quality={quality}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </SceneErrorBoundary>
        </div>
        {/* Camera controls */}
        <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2 pointer-events-none">
          <div className="glass flex flex-wrap justify-center gap-1 p-1 pointer-events-auto" role="toolbar" aria-label="Camera views">
            {CAMERA_VIEWS.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => changeView(v.id)}
                aria-pressed={view === v.id}
                className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors"
                style={{
                  background: view === v.id ? 'rgba(143,187,145,0.16)' : 'transparent',
                  border: `1px solid ${view === v.id ? 'rgba(143,187,145,0.5)' : 'transparent'}`,
                  color: view === v.id ? '#b5d6b7' : 'rgba(220,240,220,0.7)',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {view === 'monorail'
              ? 'Riding the loop line through all four districts · choose another view to leave'
              : 'Drag to rotate · Scroll or pinch to zoom · Click buildings, stations and turbines for details'}
          </p>
        </div>
        {/* District selector */}
        <div className="absolute top-20 left-4 flex flex-col gap-2">
          {districts.map(d => (
            <button key={d.id} onClick={() => focusDistrict(d)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105" style={{ background: selectedDistrict?.id === d.id ? `${d.color}30` : `${d.color}15`, border: `1px solid ${d.color}${selectedDistrict?.id === d.id ? 'aa' : '40'}`, color: d.color, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
              {d.name}
            </button>
          ))}
        </div>
        <DistrictPanel district={selectedDistrict} onClose={() => setSelectedDistrict(null)} />
      </section>

      {/* DISTRICTS OVERVIEW */}
      <section id="districts" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #0d1a0f 0%, #132016 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-widest mb-3" style={{ color: '#8fbb91' }}>URBAN DESIGN</p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">The Four <span style={{ color: '#8fbb91' }}>Districts</span></h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto', fontSize: 15 }}>Each district addresses a critical urban challenge. Together they form a complete, connected, sustainable city.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {districts.map(d => (
              <GlassPanel key={d.id} className="cursor-pointer" onClick={() => setSelectedDistrict(d)}>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, display: 'inline-block', boxShadow: `0 0 10px ${d.color}` }} />
                  <h3 className="font-display font-black text-base" style={{ color: d.color }}>{d.name}</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{d.description}</p>
                <div className="flex flex-wrap gap-2">
                  {d.features.slice(0, 3).map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${d.color}12`, border: `1px solid ${d.color}30`, color: d.color }}>{f}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {d.stats.map(s => (
                    <div key={s.label} className="text-center">
                      <div className="font-display font-bold text-sm" style={{ color: d.color }}>{s.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <EngineeringSection />
      <Dashboard />
      <BenefitsSection />
      <QuizSection />

      {/* FOOTER */}
      <footer className="py-10 px-4 text-center" style={{ borderTop: '1px solid rgba(143,187,145,0.1)' }}>
        <p className="font-display font-black text-lg mb-2" style={{ color: '#8fbb91' }}>SMART CITY 2050</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>An academic project exploring smart, sustainable urban design. All statistics are fictional design targets.</p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Built with React · Three.js · React Three Fiber · GSAP · Tailwind CSS</p>
      </footer>
    </div>
  );
}
