import { useMemo } from 'react';
import { PLINTH_HEIGHT, blocks, trees, verticalForest, type InstanceSpec, type Vec3 } from '../../data/cityLayout';
import type { District } from '../../data/districts';
import { StaticInstances } from './StaticInstances';
import { HoverLabel, useSelectable } from './Selectable';

const SENSOR_COLOR: [number, number, number] = [0.6, 3, 3.5];

/** Three-layer sphere canopy that resembles a real deciduous tree crown. */
function Trees() {
  const { trunks, bottomLayer, midLayer, topLayer } = useMemo(() => {
    const trunkList: InstanceSpec[]  = [];
    const bottomList: InstanceSpec[] = [];
    const midList: InstanceSpec[]    = [];
    const topList: InstanceSpec[]    = [];

    for (const tree of trees) {
      const [x, y, z] = tree.position;
      const s = tree.scale * 1.65;  // overall scale factor

      // Trunk
      trunkList.push({
        position: [x, y + 0.28 * s, z],
        scale: [s * 0.45, s * 0.6, s * 0.45],
      });

      // Bottom layer — widest, slightly flattened, darkest
      const baseColor = tree.color;
      bottomList.push({
        position: [x, y + 0.68 * s, z],
        scale: [s * 1.1, s * 0.9, s * 1.1],
        color: baseColor,
      });

      // Mid layer — offset slightly for organic feel
      const midJitter = (tree.scale * 0.1 - 0.05);  // deterministic offset
      midList.push({
        position: [x + midJitter, y + 1.05 * s, z - midJitter],
        scale: [s * 0.95, s * 0.95, s * 0.95],
        color: baseColor,
      });

      // Top layer — smallest, slightly lighter
      topList.push({
        position: [x - midJitter * 0.5, y + 1.4 * s, z + midJitter * 0.5],
        scale: [s * 0.70, s * 0.80, s * 0.70],
        color: baseColor,
      });
    }

    return {
      trunks:      trunkList,
      bottomLayer: bottomList,
      midLayer:    midList,
      topLayer:    topList,
    };
  }, []);

  return (
    <>
      {/* Trunk — dark brown cylinder */}
      <StaticInstances items={trunks} castShadow>
        <cylinderGeometry args={[0.055, 0.09, 0.55, 7]} />
        <meshStandardMaterial color="#5c3d20" roughness={0.98} />
      </StaticInstances>

      {/* Bottom canopy — wide base, flat-shaded for hand-painted feel */}
      <StaticInstances items={bottomLayer} castShadow receiveShadow>
        <sphereGeometry args={[0.42, 7, 6]} />
        <meshStandardMaterial roughness={0.88} flatShading />
      </StaticInstances>

      {/* Mid canopy */}
      <StaticInstances items={midLayer} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 7, 5]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </StaticInstances>

      {/* Top canopy — smallest, appears lighter because it catches more light */}
      <StaticInstances items={topLayer} castShadow receiveShadow>
        <sphereGeometry args={[0.30, 6, 5]} />
        <meshStandardMaterial roughness={0.82} flatShading />
      </StaticInstances>
    </>
  );
}

function RainGarden({ position, district, onSelect }: { position: Vec3; district: District; onSelect: (d: District) => void }) {
  const { hovered, bind } = useSelectable(() => onSelect(district));
  return (
    <group position={position}>
      <mesh position-y={0.01} receiveShadow {...bind}>
        <cylinderGeometry args={[1.15, 1.15, 0.03, 40]} />
        <meshStandardMaterial
          color="#0b3b5c"
          metalness={0.9}
          roughness={0.06}
          emissive="#0ea5e9"
          emissiveIntensity={hovered ? 0.5 : 0.12}
        />
      </mesh>
      <mesh position-y={0.02}>
        <torusGeometry args={[1.18, 0.05, 6, 48]} />
        <meshStandardMaterial color="#3f4a3c" roughness={1} />
      </mesh>
      {hovered && (
        <HoverLabel
          position={[0, 0.8, 0]}
          title="Rain Garden"
          subtitle="Collects, filters and reuses stormwater"
          color={district.color}
        />
      )}
    </group>
  );
}

const PARKS = blocks.filter(b => b.role === 'park');
const SENSORS: InstanceSpec[] = PARKS.flatMap(p =>
  [-2.2, 2.2].map(o => ({ position: [p.center[0] + o, PLINTH_HEIGHT + 0.5, p.center[1] - o] as Vec3 })),
);

export function GreenInfrastructure({ onSelect }: { onSelect: (d: District) => void }) {
  return (
    <group>
      <Trees />
      <StaticInstances items={verticalForest} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#3aaa50" roughness={0.85} emissive="#22c55e" emissiveIntensity={0.15} />
      </StaticInstances>
      {PARKS.map(p => (
        <RainGarden
          key={p.key}
          position={[p.center[0] + 0.4, PLINTH_HEIGHT, p.center[1] + 0.3]}
          district={p.district}
          onSelect={onSelect}
        />
      ))}
      <StaticInstances items={SENSORS}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color={SENSOR_COLOR} toneMapped={false} />
      </StaticInstances>
    </group>
  );
}
