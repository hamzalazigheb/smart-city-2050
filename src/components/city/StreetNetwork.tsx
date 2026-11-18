import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, MeshReflectorMaterial } from '@react-three/drei';
import {
  AVENUE_HALF_WIDTH,
  BLOCK_SIZE,
  CITY_HALF,
  PLINTH_HEIGHT,
  ROUNDABOUT_RADIUS,
  STREET_LINES,
  bikeLanes,
  blocks,
  crossings,
  laneDashes,
  streetLights,
  type BlockRole,
  type InstanceSpec,
  type Vec3,
} from '../../data/cityLayout';
import { districts } from '../../data/districts';
import { StaticInstances } from './StaticInstances';

// ─── Block surface colours — now warm greens / earthy tones ─────────────────

const PLINTH_COLORS: Partial<Record<BlockRole, string>> = {
  park:         '#1f5c2e',  // deep green park
  'solar-farm': '#2a3d1a',  // dark olive for panel fields
  plaza:        '#5a4a38',  // warm stone plaza
  battery:      '#2d3524',  // dark green-grey
  hospital:     '#d4c4a0',  // warm pale stone
  school:       '#c8b896',  // warm cream
};

const BOULEVARD_SEGMENTS: [number, number][] = [
  [ROUNDABOUT_RADIUS + 0.2, 9],
  [10.5, 15.5],
  [17, 22.25],
];

function usePlinths(): InstanceSpec[] {
  return useMemo(() => {
    const grass = new THREE.Color('#2d6830');  // lush green default
    return blocks.map(block => {
      const color =
        PLINTH_COLORS[block.role] ??
        grass.clone().lerp(new THREE.Color(block.district.color), 0.08).getStyle();
      return {
        position: [block.center[0], PLINTH_HEIGHT / 2, block.center[1]] as Vec3,
        scale: [BLOCK_SIZE, PLINTH_HEIGHT, BLOCK_SIZE] as Vec3,
        color,
      };
    });
  }, []);
}

function useBoulevards(): InstanceSpec[] {
  return useMemo(() => {
    const strips: InstanceSpec[] = [];
    const center = (AVENUE_HALF_WIDTH + 4) / 2;
    const width = 4 - AVENUE_HALF_WIDTH;
    for (const [a, b] of BOULEVARD_SEGMENTS) {
      const mid = (a + b) / 2;
      const len = b - a;
      for (const sign of [-1, 1]) {
        for (const side of [-center, center]) {
          // Warm green boulevard strips matching the reference
          strips.push({ position: [side, 0.03, sign * mid],  scale: [width, 0.07, len],  color: '#1f5c2e' });
          strips.push({ position: [sign * mid, 0.03, side],  scale: [len, 0.07, width],  color: '#1f5c2e' });
        }
      }
    }
    return strips;
  }, []);
}

function useCenterLines(): InstanceSpec[] {
  return useMemo(() => {
    const len = CITY_HALF - ROUNDABOUT_RADIUS;
    const mid = (CITY_HALF + ROUNDABOUT_RADIUS) / 2;
    const lines: InstanceSpec[] = [];
    for (const sign of [-1, 1]) {
      for (const offset of [-0.06, 0.06]) {
        lines.push({ position: [offset, 0.013, sign * mid], scale: [0.04, 0.01, len] });
        lines.push({ position: [sign * mid, 0.013, offset], scale: [len, 0.01, 0.04] });
      }
    }
    return lines;
  }, []);
}

const LAMP_POLES: InstanceSpec[] = streetLights.map(([x, y, z]) => ({ position: [x, y + 0.45, z] }));
const LAMP_HEADS: InstanceSpec[] = streetLights.map(([x, y, z]) => ({ position: [x, y + 0.92, z] }));

// ─── Animated glowing data lines on streets ─────────────────────────────────

const DATA_LINE_PATHS: Vec3[][] = [
  // Central cross
  [[-CITY_HALF, 0.06, 0],  [0, 0.06, 0],     [CITY_HALF, 0.06, 0]],
  [[0, 0.06, -CITY_HALF],  [0, 0.06, 0],     [0, 0.06, CITY_HALF]],
  // District connectors (diagonal)
  [[-13, 0.06, -13], [0, 0.06, 0], [13, 0.06, 13]],
  [[13, 0.06, -13],  [0, 0.06, 0], [-13, 0.06, 13]],
  // Outer ring segments
  [[-CITY_HALF, 0.06, -9.75], [-9.75, 0.06, -9.75]],
  [[9.75, 0.06, -9.75],  [CITY_HALF, 0.06, -9.75]],
  [[-CITY_HALF, 0.06,  9.75], [-9.75, 0.06,  9.75]],
  [[9.75, 0.06,  9.75],  [CITY_HALF, 0.06,  9.75]],
];

const DATA_CURVES = DATA_LINE_PATHS.map(pts =>
  new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false)
);
const PULSE_COUNT = DATA_CURVES.length * 3;

function DataLines({ animate }: { animate: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (animate) timeRef.current += delta;
    const t = timeRef.current;
    DATA_CURVES.forEach((curve, ci) => {
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.09 + k / 3 + ci * 0.07) % 1;
        const p = curve.getPoint(u);
        dummy.position.copy(p);
        dummy.scale.set(0.08, 0.04, 0.55);
        dummy.rotation.y = Math.atan2(
          curve.getTangent(u).x,
          curve.getTangent(u).z,
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(ci * 3 + k, dummy.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Static glowing tubes */}
      {DATA_CURVES.map((curve, i) => {
        return (
          <mesh key={i}>
            <tubeGeometry args={[curve, 48, 0.025, 6, false]} />
            <meshBasicMaterial
              color={[0.3, 2.8, 3.6]}
              toneMapped={false}
              transparent
              opacity={0.45}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      {/* Animated pulses */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, PULSE_COUNT]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial color={[0.5, 4, 5]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ─── Street-corner data nodes ────────────────────────────────────────────────

const NODE_POSITIONS: InstanceSpec[] = STREET_LINES.flatMap(x =>
  STREET_LINES.map(z => ({ position: [x, 0.09, z] as Vec3 }))
);

function DistrictBoundaries() {
  return (
    <>
      {districts.map(d => {
        const [cx, , cz] = d.position;
        const r = 9.55;
        const points: Vec3[] = [
          [cx - r, 0.1, cz - r],
          [cx + r, 0.1, cz - r],
          [cx + r, 0.1, cz + r],
          [cx - r, 0.1, cz + r],
          [cx - r, 0.1, cz - r],
        ];
        return (
          <Line
            key={d.id}
            points={points}
            color={d.color}
            lineWidth={1.8}
            dashed
            dashSize={0.6}
            gapSize={0.35}
            transparent
            opacity={0.75}
          />
        );
      })}
    </>
  );
}

export function StreetNetwork({ highQuality, animate }: { highQuality: boolean; animate: boolean }) {
  const plinths    = usePlinths();
  const boulevards = useBoulevards();
  const centerLines = useCenterLines();
  const citySize   = CITY_HALF * 2 + 1.5;

  return (
    <group>
      {/* Far green landscape outside the city */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.04} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#2a5c30" roughness={0.95} />
      </mesh>

      {/* City asphalt base — warm grey instead of near-black */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[citySize, citySize]} />
        {highQuality ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[300, 100]}
            mixBlur={0.6}
            mixStrength={6}
            depthScale={0.5}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#3a3530"
            roughness={0.9}
            metalness={0.2}
          />
        ) : (
          <meshStandardMaterial color="#3a3530" roughness={0.9} metalness={0.15} />
        )}
      </mesh>

      {/* Block plinths (grass, stone, solar, etc.) */}
      <StaticInstances items={plinths} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.88} metalness={0.0} />
      </StaticInstances>

      {/* Green boulevard strips */}
      <StaticInstances items={boulevards} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.95} />
      </StaticInstances>

      {/* Central roundabout island */}
      <mesh position-y={0.05} receiveShadow>
        <cylinderGeometry args={[3, 3, 0.12, 48]} />
        <meshStandardMaterial color="#1f5c2e" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.012}>
        <ringGeometry args={[ROUNDABOUT_RADIUS - 0.08, ROUNDABOUT_RADIUS, 64]} />
        <meshBasicMaterial color="#e8e0d0" />
      </mesh>

      {/* Road markings — warm cream not icy white */}
      <StaticInstances items={laneDashes}>
        <boxGeometry />
        <meshStandardMaterial color="#d4cfc8" roughness={0.5} emissive="#c8c0b0" emissiveIntensity={0.08} />
      </StaticInstances>
      <StaticInstances items={centerLines}>
        <boxGeometry />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </StaticInstances>
      <StaticInstances items={crossings.stripes}>
        <boxGeometry />
        <meshStandardMaterial color="#e8e0d0" roughness={0.5} />
      </StaticInstances>
      <StaticInstances items={crossings.tactile}>
        <boxGeometry />
        <meshStandardMaterial color="#f59e0b" roughness={0.7} />
      </StaticInstances>

      {/* Bike lanes — bright green */}
      <StaticInstances items={bikeLanes}>
        <boxGeometry />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.5} />
      </StaticInstances>

      {/* Street intersection data nodes */}
      <StaticInstances items={NODE_POSITIONS}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <meshBasicMaterial color={[0.3, 2.5, 3.2]} toneMapped={false} />
      </StaticInstances>

      {/* Street lamps — warm amber glow matching reference */}
      <StaticInstances items={LAMP_POLES} castShadow>
        <cylinderGeometry args={[0.022, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#8b7355" metalness={0.5} roughness={0.5} />
      </StaticInstances>
      <StaticInstances items={LAMP_HEADS}>
        <boxGeometry args={[0.16, 0.04, 0.1]} />
        <meshBasicMaterial color={[5, 3.8, 1.6]} toneMapped={false} />
      </StaticInstances>

      {/* Glowing cyan data lines on the road surface */}
      <DataLines animate={animate} />

      <DistrictBoundaries />
    </group>
  );
}
