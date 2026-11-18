import { useRef, type MutableRefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { Cloud, Clouds, Environment, Html, Lightformer, OrbitControls, Sky, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { buildings, crowns, antennas, type InstanceSpec } from '../../data/cityLayout';
import { districts, type District } from '../../data/districts';
import { Building } from './Building';
import { CameraRig, INTRO_CAMERA_POSITION, type CameraView } from './CameraRig';
import { useDistrictMaterials } from './cityMaterials';
import { EnergySystem } from './EnergySystem';
import { GreenInfrastructure } from './GreenInfrastructure';
import { Landmarks } from './Landmarks';
import { StaticInstances } from './StaticInstances';
import { StreetNetwork } from './StreetNetwork';
import { Monorail, TrafficSignals, Traffic } from './Transit';
import { FlyingCars } from './FlyingCars';

export type SceneQuality = 'high' | 'low';

const ANTENNA_MASTS: InstanceSpec[] = antennas.map(([x, y, z]) => ({ position: [x, y + 0.8, z] }));
const ANTENNA_LIGHTS: InstanceSpec[] = antennas.map(([x, y, z]) => ({ position: [x, y + 1.65, z] }));

function CityModel({ onDistrictSelect, onControlCentre, animate, trainProgress, riding, highQuality }: CityModelProps) {
  const materials = useDistrictMaterials();
  return (
    <group>
      <StreetNetwork highQuality={highQuality} animate={animate} />
      {buildings.map(spec => (
        <Building key={spec.key} spec={spec} materials={materials[spec.district.id]} onSelect={onDistrictSelect} />
      ))}
      <StaticInstances items={crowns}>
        <boxGeometry />
        <meshBasicMaterial color={[3.2, 3.2, 3.2]} toneMapped={false} />
      </StaticInstances>
      <StaticInstances items={ANTENNA_MASTS}>
        <cylinderGeometry args={[0.03, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </StaticInstances>
      <StaticInstances items={ANTENNA_LIGHTS}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={[4, 0.25, 0.25]} toneMapped={false} />
      </StaticInstances>
      <GreenInfrastructure onSelect={onDistrictSelect} />
      <EnergySystem onSelect={onDistrictSelect} animate={animate} />
      <Landmarks materials={materials} onSelect={onDistrictSelect} onControlCentre={onControlCentre} animate={animate} />
      <Monorail onSelect={onDistrictSelect} progress={trainProgress} running={animate || riding} />
      <Traffic animate={animate} />
      <TrafficSignals onSelect={onDistrictSelect} animate={animate} />
      <FlyingCars animate={animate} />
    </group>
  );
}

interface CityModelProps {
  onDistrictSelect: (d: District) => void;
  onControlCentre: () => void;
  animate: boolean;
  riding: boolean;
  highQuality: boolean;
  trainProgress: MutableRefObject<number>;
}

function DistrictBeacons({ onSelect, selected }: { onSelect: (d: District) => void; selected: District | null }) {
  return (
    <>
      {districts.map(d => (
        <Html key={d.id} position={[d.position[0], 13, d.position[2]]} center zIndexRange={[20, 0]}>
          <button
            type="button"
            onClick={() => onSelect(d)}
            className="font-display"
            style={{
              background: selected?.id === d.id ? `${d.color}33` : 'rgba(5,13,26,0.75)',
              border: `1px solid ${d.color}${selected?.id === d.id ? 'ff' : '88'}`,
              color: d.color,
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 10,
              letterSpacing: '0.15em',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
          >
            {d.name}
          </button>
        </Html>
      ))}
    </>
  );
}

interface Props {
  onDistrictSelect: (d: District) => void;
  onControlCentre: () => void;
  selectedDistrict: District | null;
  view: CameraView;
  ready: boolean;
  active: boolean;
  quality: SceneQuality;
  reducedMotion: boolean;
}

export function CityScene({
  onDistrictSelect,
  onControlCentre,
  selectedDistrict,
  view,
  ready,
  active,
  quality,
  reducedMotion,
}: Props) {
  const trainProgress = useRef(0);
  const highQuality = quality === 'high';
  const animate = !reducedMotion;

  // Always run the render loop — "never" combined with Suspense/lazy
  // caused the canvas to freeze before city content loaded.
  void active;

  return (
    <Canvas
      shadows={highQuality}
      dpr={[1, highQuality ? 1.75 : 1.25]}
      frameloop="always"
      camera={{ position: INTRO_CAMERA_POSITION, fov: 45, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      onPointerMissed={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Fallback background while Sky mesh loads */}
      <color attach="background" args={['#4a7bbf']} />

      {/* ── Sunset sky ── */}
      <Sky
        distance={4500}
        sunPosition={[80, 6, -120]}
        inclination={0.505}
        azimuth={0.21}
        turbidity={9}
        rayleigh={0.4}
        mieCoefficient={0.012}
        mieDirectionalG={0.96}
      />

      {/* Dusk haze — start further so tall buildings are always visible */}
      <fog attach="fog" args={['#c8884a', 90, 260]} />

      {/* ── Lighting ── */}
      {/* Strong ambient so NOTHING is ever pitch black */}
      <ambientLight intensity={1.8} color="#ffe4c4" />
      {/* Sky dome */}
      <hemisphereLight args={['#f4a955', '#5b4a90', 2.0]} />
      {/* Golden-hour sun from low west angle */}
      <directionalLight
        position={[80, 18, -100]}
        intensity={4.5}
        color="#ffb347"
        castShadow={highQuality}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={280}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />
      {/* Cool sky fill from the east */}
      <directionalLight position={[-60, 25, 60]} intensity={1.4} color="#8ab8e0" />
      {/* Overhead fill — ensures rooftops are always lit */}
      <directionalLight position={[0, 60, 0]} intensity={1.0} color="#ffe8d0" />

      {/* Per-district warm fill at street level */}
      {districts.map(d => (
        <pointLight key={d.id} position={[d.position[0], 4, d.position[2]]} color="#ffcc88" intensity={150} distance={32} decay={2} />
      ))}
      {/* City centre top light */}
      <pointLight position={[0, 18, 0]} color="#22d3ee" intensity={100} distance={35} decay={2} />

      <Environment resolution={256} frames={1}>
        {/* Simulate sunset sky in reflections */}
        <Lightformer form="rect" intensity={3}   color="#ff9f47" scale={[200, 30, 1]} position={[0, 15, -180]} />
        <Lightformer form="rect" intensity={1.4} color="#f97316" scale={[200, 10, 1]} position={[0, 5,  -180]} />
        <Lightformer form="rect" intensity={0.9} color="#7c3aed" scale={[200, 60, 1]} position={[0, 60, -180]} rotation-x={-0.3} />
        <Lightformer form="rect" intensity={0.6} color="#bfdbfe" scale={[200, 30, 1]} position={[0, 15,  180]} rotation-y={Math.PI} />
      </Environment>

      {/* ── Clouds ── */}
      {!reducedMotion && (
        <Clouds limit={12} range={160}>
          <Cloud seed={1} bounds={[80, 10, 80]} segments={30} position={[0, 55, -80]}   speed={0.08} opacity={0.55} color="#ffd4a8" growth={6} volume={25} />
          <Cloud seed={2} bounds={[60, 8,  60]} segments={24} position={[-60, 48, -50]} speed={0.06} opacity={0.40} color="#f0c8a0" growth={5} volume={20} />
          <Cloud seed={3} bounds={[70, 8,  50]} segments={28} position={[55,  52, -70]} speed={0.07} opacity={0.45} color="#e8c090" growth={5} volume={18} />
          <Cloud seed={4} bounds={[50, 6,  50]} segments={20} position={[-20, 60,  90]} speed={0.05} opacity={0.30} color="#c8d8f0" growth={4} volume={14} />
          <Cloud seed={5} bounds={[80, 10, 80]} segments={26} position={[80,  50,  40]} speed={0.09} opacity={0.35} color="#f0d0b0" growth={6} volume={16} />
        </Clouds>
      )}

      {/* A handful of bright stars/planets peeking through the dusk sky */}
      <Stars radius={300} depth={40} count={400} factor={2.5} saturation={0.1} fade speed={0} />

      <CityModel
        onDistrictSelect={onDistrictSelect}
        onControlCentre={onControlCentre}
        animate={animate}
        riding={view === 'monorail'}
        highQuality={highQuality}
        trainProgress={trainProgress}
      />
      <DistrictBeacons onSelect={onDistrictSelect} selected={selectedDistrict} />

      <OrbitControls
        makeDefault
        target={[0, 1, 0]}
        enableDamping
        dampingFactor={0.06}
        minDistance={3}
        maxDistance={180}
        maxPolarAngle={Math.PI / 2 - 0.01}
        screenSpacePanning={false}
      />
      <CameraRig
        view={view}
        focus={selectedDistrict}
        ready={ready}
        reducedMotion={reducedMotion}
        trainProgress={trainProgress}
      />

      {/* Post-processing: bloom only — no tone-mapping pass (renderer handles it) */}
      {highQuality && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.6} luminanceSmoothing={0.35} radius={0.8} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
