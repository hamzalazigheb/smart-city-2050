import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Path definitions ────────────────────────────────────────────────────────

type V3 = [number, number, number];

/** All aerial traffic lanes. Heights 6-18 above ground. */
const PATHS: V3[][] = [
  // District-to-district express lanes (high altitude)
  [[-13, 14, -13], [0, 16, -18], [13, 14, -13], [18, 16, 0], [13, 14, 13], [0, 16, 18], [-13, 14, 13], [-18, 16, 0]],
  [[13, 12, -13], [18, 13, 0], [13, 12, 13], [0, 13, 18], [-13, 12, 13], [-18, 13, 0], [-13, 12, -13], [0, 13, -18]],

  // Control-tower orbit (tight ring around the central spire)
  [[5, 15, 0], [3.5, 16.5, 3.5], [0, 17, 5], [-3.5, 16.5, 3.5], [-5, 15, 0], [-3.5, 14, -3.5], [0, 13.5, -5], [3.5, 14, -3.5]],
  [[4, 18, 0], [0, 18.5, 4], [-4, 18, 0], [0, 17.5, -4]],

  // Mid-altitude commuter lanes (follow main avenues)
  [[-22, 8, 0.4], [-10, 9, 0.4], [0, 8.5, 0.4], [10, 9, 0.4], [22, 8, 0.4], [10, 7.5, 0.4], [0, 8, 0.4], [-10, 7.5, 0.4]],
  [[0.4, 8, -22], [0.4, 9, -10], [0.4, 8.5, 0], [0.4, 9, 10], [0.4, 8, 22], [0.4, 7.5, 10], [0.4, 8, 0], [0.4, 7.5, -10]],
  [[-22, 7, -0.4], [-10, 7.5, -0.4], [0, 7, -0.4], [10, 7.5, -0.4], [22, 7, -0.4], [10, 6.5, -0.4], [0, 7, -0.4], [-10, 6.5, -0.4]],

  // Low hover taxis (above street level, weaving between buildings)
  [[-13, 6.5, -5], [-5, 7, -13], [5, 6, -13], [13, 6.5, -5], [13, 7, 5], [5, 6.5, 13], [-5, 7, 13], [-13, 6, 5]],
  [[13, 6, -5], [5, 6.5, -13], [-5, 6, -13], [-13, 6.5, -5], [-13, 6, 5], [-5, 6.5, 13], [5, 6, 13], [13, 6.5, 5]],
  [[-20, 9, -20], [-8, 10, -20], [8, 9, -20], [20, 9.5, -8], [20, 9, 8], [8, 9.5, 20], [-8, 9, 20], [-20, 9.5, 8]],

  // Emergency/delivery drones (erratic, fast short hops)
  [[-13, 10, -13], [0, 11, -13], [13, 10, -13], [13, 11, 0]],
  [[13, 10, 13], [0, 11, 13], [-13, 10, 13], [-13, 11, 0]],

  // Long diagonal cross-city routes
  [[-22, 11, -22], [0, 13, 0], [22, 11, 22]],
  [[22, 11, -22], [0, 13, 0], [-22, 11, 22]],

  // Slow scenic tour above green district
  [[-13, 9, -18], [-18, 10, -13], [-20, 9.5, -5], [-18, 10, 5], [-13, 9, 13], [-5, 9.5, 18]],
];

// ─── Car config: one entry per vehicle ───────────────────────────────────────

interface CarConfig {
  pathIndex: number;
  speed: number;             // city units per second
  offset: number;            // 0-1 starting position on path
  kind: 'taxi' | 'drone' | 'shuttle' | 'emergency';
  bodyColor: string;
  glowColor: [number, number, number]; // HDR colour for bloom
  scale: number;
  rotorCount: 4 | 6 | 8;
}

const CARS: CarConfig[] = [
  // Express altitude - large shuttles
  { pathIndex: 0, speed: 7.5,  offset: 0.00, kind: 'shuttle',   bodyColor: '#f1f5f9', glowColor: [0.3, 2.4, 3.5], scale: 1,    rotorCount: 4 },
  { pathIndex: 0, speed: 7.5,  offset: 0.50, kind: 'shuttle',   bodyColor: '#e2e8f0', glowColor: [0.3, 2.4, 3.5], scale: 1,    rotorCount: 4 },
  { pathIndex: 1, speed: 6.5,  offset: 0.25, kind: 'shuttle',   bodyColor: '#cbd5e1', glowColor: [0.3, 1.8, 3.2], scale: 0.95, rotorCount: 4 },
  { pathIndex: 1, speed: 6.5,  offset: 0.75, kind: 'shuttle',   bodyColor: '#94a3b8', glowColor: [0.3, 1.8, 3.2], scale: 0.95, rotorCount: 4 },

  // Control tower orbit - small taxis
  { pathIndex: 2, speed: 4.5,  offset: 0.00, kind: 'taxi',      bodyColor: '#fde68a', glowColor: [4.5, 2.5, 0.2], scale: 0.7,  rotorCount: 4 },
  { pathIndex: 2, speed: 4.5,  offset: 0.50, kind: 'taxi',      bodyColor: '#fcd34d', glowColor: [4.5, 2.5, 0.2], scale: 0.65, rotorCount: 4 },
  { pathIndex: 3, speed: 5.5,  offset: 0.00, kind: 'taxi',      bodyColor: '#fff',    glowColor: [3.5, 3.5, 3.5], scale: 0.55, rotorCount: 4 },

  // Mid commuter lanes
  { pathIndex: 4, speed: 8,    offset: 0.1,  kind: 'shuttle',   bodyColor: '#7dd3fc', glowColor: [0.5, 2.0, 4.0], scale: 0.8,  rotorCount: 6 },
  { pathIndex: 4, speed: 8,    offset: 0.6,  kind: 'shuttle',   bodyColor: '#38bdf8', glowColor: [0.5, 2.0, 4.0], scale: 0.8,  rotorCount: 6 },
  { pathIndex: 5, speed: 7,    offset: 0.3,  kind: 'shuttle',   bodyColor: '#a5b4fc', glowColor: [1.5, 1.0, 4.5], scale: 0.75, rotorCount: 6 },
  { pathIndex: 6, speed: 7.5,  offset: 0.7,  kind: 'taxi',      bodyColor: '#6ee7b7', glowColor: [0.3, 4.0, 2.0], scale: 0.65, rotorCount: 4 },

  // Low hover taxis
  { pathIndex: 7, speed: 5,    offset: 0.0,  kind: 'taxi',      bodyColor: '#fbbf24', glowColor: [4.0, 2.0, 0.2], scale: 0.6,  rotorCount: 4 },
  { pathIndex: 8, speed: 5.5,  offset: 0.4,  kind: 'taxi',      bodyColor: '#f87171', glowColor: [4.0, 0.3, 0.3], scale: 0.6,  rotorCount: 4 },
  { pathIndex: 9, speed: 6,    offset: 0.2,  kind: 'shuttle',   bodyColor: '#c4b5fd', glowColor: [2.0, 0.8, 4.5], scale: 0.7,  rotorCount: 6 },

  // Delivery drones (small, fast)
  { pathIndex: 10, speed: 12,  offset: 0.0,  kind: 'drone',     bodyColor: '#1e293b', glowColor: [0.2, 3.5, 0.5], scale: 0.4,  rotorCount: 4 },
  { pathIndex: 11, speed: 11,  offset: 0.5,  kind: 'drone',     bodyColor: '#0f172a', glowColor: [3.5, 0.2, 3.5], scale: 0.4,  rotorCount: 4 },
  { pathIndex: 12, speed: 14,  offset: 0.0,  kind: 'drone',     bodyColor: '#334155', glowColor: [0.2, 0.5, 4.5], scale: 0.35, rotorCount: 4 },
  { pathIndex: 13, speed: 14,  offset: 0.5,  kind: 'drone',     bodyColor: '#1e293b', glowColor: [4.5, 0.2, 0.2], scale: 0.35, rotorCount: 4 },

  // Scenic / emergency
  { pathIndex: 14, speed: 4,   offset: 0.0,  kind: 'taxi',      bodyColor: '#ecfdf5', glowColor: [0.3, 4.0, 1.5], scale: 0.65, rotorCount: 6 },
  // emergency uses the outer express ring (pathIndex 0) — was 15 (out-of-bounds)
  { pathIndex: 0,  speed: 10,  offset: 0.3,  kind: 'emergency', bodyColor: '#fff',    glowColor: [5.0, 0.2, 0.2], scale: 0.5,  rotorCount: 8 },
];

const TOTAL = CARS.length;

// ─── Build CatmullRom curves once ───────────────────────────────────────────

const CURVES = PATHS.map(pts =>
  new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), true, 'centripetal'),
);

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  animate: boolean;
}

export function FlyingCars({ animate }: Props) {
  // Refs for instanced meshes
  const bodyRef   = useRef<THREE.InstancedMesh>(null);
  const glowRef   = useRef<THREE.InstancedMesh>(null);
  const headRef   = useRef<THREE.InstancedMesh>(null);
  const tailRef   = useRef<THREE.InstancedMesh>(null);
  const rotorRef  = useRef<THREE.InstancedMesh>(null);
  const wingRef   = useRef<THREE.InstancedMesh>(null);
  const trailRef  = useRef<THREE.InstancedMesh>(null);

  const time      = useRef(0);
  const dummy     = useMemo(() => new THREE.Object3D(), []);
  const ahead     = useMemo(() => new THREE.Vector3(), []);
  const rot       = useMemo(() => new THREE.Quaternion(), []);
  const look      = useMemo(() => new THREE.Matrix4(), []);

  // Set per-instance colours once
  useLayoutEffect(() => {
    const color = new THREE.Color();
    const glowColor = new THREE.Color();

    CARS.forEach((car, i) => {
      // body colour
      color.set(car.bodyColor);
      bodyRef.current?.setColorAt(i, color);
      wingRef.current?.setColorAt(i, color);

      // glow underbelly colour (HDR — will bloom)
      glowColor.setRGB(...car.glowColor);
      glowRef.current?.setColorAt(i, glowColor);

      // rotor rings — neutral grey
      color.set('#cbd5e1');
      rotorRef.current?.setColorAt(i, color);

      // headlights white
      trailRef.current?.setColorAt(i, new THREE.Color(car.glowColor[0] * 0.8, car.glowColor[1] * 0.8, car.glowColor[2] * 0.8));
    });

    [bodyRef, glowRef, headRef, tailRef, rotorRef, wingRef, trailRef].forEach(r => {
      if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, []);

  useFrame((_, delta) => {
    if (animate) time.current += delta;
    const t = time.current;

    CARS.forEach((car, i) => {
      const curve = CURVES[car.pathIndex];
      if (!curve) return;                // guard: skip if pathIndex is out-of-range
      const len   = curve.getLength();
      const u     = (car.offset + (t * car.speed) / len) % 1;
      const uNext = (u + 1.5 / len) % 1;

      // Current & look-ahead positions
      curve.getPointAt(u, dummy.position);
      curve.getPointAt(uNext, ahead);

      // Banking: measure how much the path curves laterally
      const diff  = ahead.clone().sub(dummy.position).normalize();
      const bank  = diff.x * 0.55 + diff.z * 0.18;  // crude lateral lean

      // Build orientation: forward = diff, then bank
      look.lookAt(dummy.position, ahead, new THREE.Vector3(0, 1, 0));
      rot.setFromRotationMatrix(look);

      // Add bank rotation around forward axis
      const bankQ = new THREE.Quaternion().setFromAxisAngle(diff, -bank);
      rot.premultiply(bankQ);

      const s = car.scale;

      // ── Body ──
      dummy.scale.set(s * 0.9, s * 0.22, s * 1.6);
      dummy.quaternion.copy(rot);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(i, dummy.matrix);

      // ── Wings ──
      dummy.scale.set(s * 2.2, s * 0.1, s * 0.6);
      dummy.updateMatrix();
      wingRef.current?.setMatrixAt(i, dummy.matrix);

      // ── Underbelly glow (slightly lower) ──
      const down = new THREE.Vector3(0, -1, 0).applyQuaternion(rot).multiplyScalar(s * 0.14);
      dummy.position.addVectors(dummy.position, down);
      dummy.scale.set(s * 0.75, s * 0.06, s * 1.3);
      dummy.updateMatrix();
      glowRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.copy(curve.getPointAt(u));

      // ── Headlights (front, tiny) ──
      const fwd = diff.clone().multiplyScalar(s * 0.82);
      dummy.position.addVectors(curve.getPointAt(u), fwd);
      dummy.scale.setScalar(s * 0.14);
      dummy.updateMatrix();
      headRef.current?.setMatrixAt(i, dummy.matrix);

      // ── Tail lights (rear) ──
      dummy.position.subVectors(curve.getPointAt(u), fwd);
      dummy.scale.setScalar(s * 0.11);
      dummy.updateMatrix();
      tailRef.current?.setMatrixAt(i, dummy.matrix);

      // ── Rotor ring (spins) ──
      dummy.position.copy(curve.getPointAt(u));
      const rotSpin = new THREE.Quaternion().setFromAxisAngle(diff, t * 18 + i * 1.4);
      dummy.quaternion.copy(rot).premultiply(rotSpin);
      dummy.scale.set(s * 1.05, s * 0.04, s * 1.05);
      dummy.updateMatrix();
      rotorRef.current?.setMatrixAt(i, dummy.matrix);

      // ── Wake trail (behind + slightly down) ──
      const back = diff.clone().multiplyScalar(-s * 1.0);
      dummy.position.addVectors(curve.getPointAt(u), back);
      dummy.position.y -= s * 0.08;
      dummy.quaternion.copy(rot);
      dummy.scale.set(s * 0.14, s * 0.06, s * 1.2);
      dummy.updateMatrix();
      trailRef.current?.setMatrixAt(i, dummy.matrix);
    });

    [bodyRef, glowRef, headRef, tailRef, rotorRef, wingRef, trailRef].forEach(r => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group frustumCulled={false}>
      {/* Body */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, TOTAL]} castShadow frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial metalness={0.7} roughness={0.25} />
      </instancedMesh>

      {/* Wings */}
      <instancedMesh ref={wingRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial metalness={0.5} roughness={0.35} transparent opacity={0.9} />
      </instancedMesh>

      {/* Underbelly glow — HDR emissive → blooms */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Headlights */}
      <instancedMesh ref={headRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={[5, 5, 4.6]} toneMapped={false} />
      </instancedMesh>

      {/* Tail lights */}
      <instancedMesh ref={tailRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={[4.5, 0.2, 0.2]} toneMapped={false} />
      </instancedMesh>

      {/* Rotor rings */}
      <instancedMesh ref={rotorRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <torusGeometry args={[1, 0.07, 6, 24]} />
        <meshBasicMaterial color={[2, 2, 2]} toneMapped={false} transparent opacity={0.65} />
      </instancedMesh>

      {/* Wake trail (glow, transparent) */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.35} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
