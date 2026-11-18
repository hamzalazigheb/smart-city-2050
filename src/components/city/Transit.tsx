import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  MONORAIL,
  monorailPoints,
  trafficLanes,
  trafficSignals,
  type InstanceSpec,
  type Vec3,
  type VehicleKind,
} from '../../data/cityLayout';
import { districts, type District } from '../../data/districts';
import { StaticInstances } from './StaticInstances';
import { HoverLabel, useSelectable } from './Selectable';

export const MONORAIL_CURVE = new THREE.CatmullRomCurve3(
  monorailPoints().map(p => new THREE.Vector3(...p)),
  true,
  'centripetal',
);
const BEAM_CURVE = new THREE.CatmullRomCurve3(
  monorailPoints(MONORAIL.height - 0.22).map(p => new THREE.Vector3(...p)),
  true,
  'centripetal',
);
const TRACK_LENGTH = MONORAIL_CURVE.getLength();
const TRAIN_SPEED = 3.2;
const CAR_SPACING = 1.45;

const mobilityDistrict = districts.find(d => d.id === 'mobility-grid')!;
const districtAt = (x: number, z: number) =>
  districts.find(d => Math.sign(d.position[0]) === Math.sign(x) && Math.sign(d.position[2]) === Math.sign(z))!;

const PILLARS: InstanceSpec[] = Array.from({ length: 36 }, (_, i) => {
  const p = MONORAIL_CURVE.getPointAt(i / 36);
  const h = MONORAIL.height - 0.2;
  return { position: [p.x, h / 2, p.z], scale: [1, h, 1] };
});

interface StationSpec {
  position: Vec3;
  rotationY: number;
  district: District;
}

const STATIONS: StationSpec[] = [0, 1, 2, 3].map(i => {
  const { half, cornerRadius: r } = MONORAIL;
  const angle = (i * Math.PI) / 2 + Math.PI / 4;
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const cx = Math.sign(radial.x) * (half - r);
  const cz = Math.sign(radial.z) * (half - r);
  const point = new THREE.Vector3(cx, 0, cz).addScaledVector(radial, r + 0.85);
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
  return {
    position: [point.x, 0, point.z],
    rotationY: Math.atan2(-tangent.z, tangent.x),
    district: districtAt(point.x, point.z),
  };
});

function Station({ spec, onSelect }: { spec: StationSpec; onSelect: (d: District) => void }) {
  const { hovered, bind } = useSelectable(() => onSelect(spec.district));
  const deck = MONORAIL.height - 0.35;
  return (
    <group position={spec.position} rotation-y={spec.rotationY} {...bind}>
      <mesh position-y={deck} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.12, 0.9]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, deck + 0.02, -0.4]}>
        <boxGeometry args={[2.6, 0.02, 0.06]} />
        <meshBasicMaterial color={[3.6, 3, 0.4]} toneMapped={false} />
      </mesh>
      <mesh position-y={deck + 1.05}>
        <boxGeometry args={[3, 0.05, 1.1]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} metalness={0.9} roughness={0.05} />
      </mesh>
      <mesh position={[1.55, deck / 2 + 0.3, 0.1]}>
        <boxGeometry args={[0.5, deck + 0.6, 0.5]} />
        <meshStandardMaterial
          color="#67e8f9"
          transparent
          opacity={hovered ? 0.55 : 0.3}
          emissive="#22d3ee"
          emissiveIntensity={hovered ? 1.4 : 0.6}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>
      {hovered && (
        <HoverLabel
          position={[0, deck + 1.8, 0]}
          title="Monorail Station"
          subtitle="Step-free lift · audio & visual information"
          color={spec.district.color}
        />
      )}
    </group>
  );
}

interface MonorailProps {
  onSelect: (d: District) => void;
  progress: MutableRefObject<number>;
  running: boolean;
}

export function Monorail({ onSelect, progress, running }: MonorailProps) {
  const cars = useRef<(THREE.Group | null)[]>([]);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (running) progress.current = (progress.current + (delta * TRAIN_SPEED) / TRACK_LENGTH) % 1;
    cars.current.forEach((car, i) => {
      if (!car) return;
      const u = (progress.current - (i * CAR_SPACING) / TRACK_LENGTH + 1) % 1;
      const p = MONORAIL_CURVE.getPointAt(u);
      car.position.set(p.x, p.y + 0.36, p.z);
      MONORAIL_CURVE.getPointAt((u + 0.004) % 1, ahead);
      ahead.y = car.position.y;
      car.lookAt(ahead);
    });
  });

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[MONORAIL_CURVE, 360, 0.15, 8, true]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh>
        <tubeGeometry args={[BEAM_CURVE, 360, 0.035, 6, true]} />
        <meshBasicMaterial color={[0.3, 2.2, 3.2]} toneMapped={false} />
      </mesh>
      <StaticInstances items={PILLARS} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.35} />
      </StaticInstances>
      {STATIONS.map((s, i) => (
        <Station key={i} spec={s} onSelect={onSelect} />
      ))}
      {[0, 1, 2, 3].map(i => (
        <group key={i} ref={el => { cars.current[i] = el; }}>
          <RoundedBox args={[0.5, 0.46, 1.32]} radius={0.12} smoothness={3} castShadow>
            <meshStandardMaterial color="#f1f5f9" metalness={0.5} roughness={0.25} />
          </RoundedBox>
          <mesh position-y={0.06}>
            <boxGeometry args={[0.52, 0.12, 1.12]} />
            <meshBasicMaterial color={[0.4, 2.4, 3.4]} toneMapped={false} />
          </mesh>
          {i === 0 && (
            <mesh position={[0, -0.05, 0.67]}>
              <boxGeometry args={[0.3, 0.06, 0.02]} />
              <meshBasicMaterial color={[5, 5, 5]} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

interface Vehicle {
  from: THREE.Vector3;
  dir: THREE.Vector3;
  length: number;
  heading: number;
  speed: number;
  offset: number;
}

const CAR_COLORS = ['#e2e8f0', '#94a3b8', '#1e293b', '#0f172a', '#334155', '#7dd3fc', '#f8fafc', '#475569'];

function buildVehicles(kind: VehicleKind): Vehicle[] {
  const list: Vehicle[] = [];
  for (const lane of trafficLanes) {
    const from = new THREE.Vector3(lane.from[0], 0, lane.from[1]);
    const to = new THREE.Vector3(lane.to[0], 0, lane.to[1]);
    const delta = to.clone().sub(from);
    const length = delta.length();
    lane.vehicles.forEach((k, i) => {
      if (k !== kind) return;
      list.push({
        from,
        dir: delta.clone().normalize(),
        length,
        heading: Math.atan2(delta.x, delta.z),
        speed: lane.speed,
        offset: (i / lane.vehicles.length + (lane.from[0] * 0.013 + lane.from[1] * 0.007)) % 1,
      });
    });
  }
  return list;
}

const CARS = buildVehicles('car');
const SHUTTLES = buildVehicles('shuttle');

interface PartSpec {
  offset: Vec3;
  ref: MutableRefObject<THREE.InstancedMesh | null>;
}

function useVehicleAnimation(vehicles: Vehicle[], parts: PartSpec[], animate: boolean) {
  const helpers = useMemo(
    () => ({
      body: new THREE.Object3D(),
      offset: new THREE.Matrix4(),
      out: new THREE.Matrix4(),
    }),
    [],
  );
  const time = useRef(0);

  useFrame((_, delta) => {
    if (animate) time.current += delta;
    const { body, offset, out } = helpers;
    vehicles.forEach((v, i) => {
      const t = (v.offset + (time.current * v.speed) / v.length) % 1;
      const fade = Math.min(1, t / 0.03, (1 - t) / 0.03);
      body.position.copy(v.from).addScaledVector(v.dir, t * v.length);
      body.rotation.set(0, v.heading, 0);
      body.scale.setScalar(Math.max(fade, 0.0001));
      body.updateMatrix();
      for (const part of parts) {
        const mesh = part.ref.current;
        if (!mesh) continue;
        offset.makeTranslation(...part.offset);
        out.multiplyMatrices(body.matrix, offset);
        mesh.setMatrixAt(i, out);
      }
    });
    for (const part of parts) {
      if (part.ref.current) part.ref.current.instanceMatrix.needsUpdate = true;
    }
  });
}

export function Traffic({ animate }: { animate: boolean }) {
  const carBody = useRef<THREE.InstancedMesh>(null);
  const carCabin = useRef<THREE.InstancedMesh>(null);
  const carHead = useRef<THREE.InstancedMesh>(null);
  const carTail = useRef<THREE.InstancedMesh>(null);
  const shuttleBody = useRef<THREE.InstancedMesh>(null);
  const shuttleBand = useRef<THREE.InstancedMesh>(null);

  useVehicleAnimation(
    CARS,
    [
      { offset: [0, 0.11, 0], ref: carBody },
      { offset: [0, 0.23, -0.03], ref: carCabin },
      { offset: [0, 0.11, 0.305], ref: carHead },
      { offset: [0, 0.12, -0.305], ref: carTail },
    ],
    animate,
  );
  useVehicleAnimation(
    SHUTTLES,
    [
      { offset: [0, 0.2, 0], ref: shuttleBody },
      { offset: [0, 0.26, 0], ref: shuttleBand },
    ],
    animate,
  );

  useLayoutEffect(() => {
    const mesh = carBody.current;
    if (!mesh) return;
    const color = new THREE.Color();
    CARS.forEach((_, i) => mesh.setColorAt(i, color.set(CAR_COLORS[i % CAR_COLORS.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={carBody} args={[undefined, undefined, CARS.length]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.3, 0.12, 0.6]} />
        <meshStandardMaterial metalness={0.8} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={carCabin} args={[undefined, undefined, CARS.length]} frustumCulled={false}>
        <boxGeometry args={[0.26, 0.11, 0.32]} />
        <meshStandardMaterial color="#0b1220" metalness={0.9} roughness={0.1} />
      </instancedMesh>
      <instancedMesh ref={carHead} args={[undefined, undefined, CARS.length]} frustumCulled={false}>
        <boxGeometry args={[0.26, 0.035, 0.015]} />
        <meshBasicMaterial color={[5, 5, 4.4]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={carTail} args={[undefined, undefined, CARS.length]} frustumCulled={false}>
        <boxGeometry args={[0.26, 0.035, 0.015]} />
        <meshBasicMaterial color={[4, 0.15, 0.15]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={shuttleBody} args={[undefined, undefined, SHUTTLES.length]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.38, 0.3, 0.82]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.4} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={shuttleBand} args={[undefined, undefined, SHUTTLES.length]} frustumCulled={false}>
        <boxGeometry args={[0.39, 0.08, 0.7]} />
        <meshBasicMaterial color={[0.4, 2.4, 3.6]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

const SIGNAL_CYCLE = 8;

export function TrafficSignals({ onSelect, animate }: { onSelect: (d: District) => void; animate: boolean }) {
  const lamps = useMemo(() => trafficSignals.map(() => new THREE.MeshBasicMaterial({ toneMapped: false })), []);
  useEffect(() => () => lamps.forEach(m => m.dispose()), [lamps]);
  const { hovered, point, bind } = useSelectable(() => onSelect(mobilityDistrict));

  useFrame(({ clock }) => {
    const time = animate ? clock.elapsedTime : 0;
    lamps.forEach((material, i) => {
      const phase = (time + (i % 2) * (SIGNAL_CYCLE / 2) + Math.floor(i / 2) * 1.3) % SIGNAL_CYCLE;
      if (phase < 3.2) material.color.setRGB(0.2, 3.5, 0.6);
      else if (phase < 4) material.color.setRGB(4, 2.4, 0.2);
      else material.color.setRGB(4, 0.2, 0.15);
    });
  });

  return (
    <group {...bind}>
      {trafficSignals.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position-y={0.55} castShadow>
            <cylinderGeometry args={[0.025, 0.03, 1.1, 6]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position-y={1.12}>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position-y={1.12} material={lamps[i]}>
            <sphereGeometry args={[0.07, 10, 10]} />
          </mesh>
        </group>
      ))}
      {hovered && (
        <HoverLabel
          position={[point[0], point[1] + 0.8, point[2]]}
          title="AI Traffic Signal"
          subtitle="Timing adapts to live traffic data"
          color={mobilityDistrict.color}
        />
      )}
    </group>
  );
}
