import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLINTH_HEIGHT, blockOf, hubs, solarPanels, windTurbines, type Vec3 } from '../../data/cityLayout';
import { districts, type District } from '../../data/districts';
import { StaticInstances } from './StaticInstances';
import { HoverLabel, useSelectable } from './Selectable';

const energyDistrict = districts.find(d => d.id === 'energy-district')!;

interface SystemProps {
  onSelect: (d: District) => void;
  animate: boolean;
}

function SolarArrays({ onSelect }: { onSelect: (d: District) => void }) {
  const { hovered, point, bind } = useSelectable(() => onSelect(energyDistrict));
  return (
    <group {...bind}>
      <StaticInstances items={solarPanels} castShadow>
        <boxGeometry />
        <meshStandardMaterial
          color="#0b2550"
          metalness={0.75}
          roughness={0.18}
          emissive="#2563eb"
          emissiveIntensity={hovered ? 0.9 : 0.22}
        />
      </StaticInstances>
      {hovered && (
        <HoverLabel
          position={[point[0], point[1] + 0.8, point[2]]}
          title="Solar Panels"
          subtitle="Rooftop & field photovoltaics"
          color={energyDistrict.color}
        />
      )}
    </group>
  );
}

function WindFarm({ onSelect, animate }: SystemProps) {
  const rotors = useRef<(THREE.Group | null)[]>([]);
  const { hovered, point, bind } = useSelectable(() => onSelect(energyDistrict));

  useFrame((_, delta) => {
    if (!animate) return;
    rotors.current.forEach((rotor, i) => {
      if (rotor) rotor.rotation.z += delta * (1.1 + (i % 3) * 0.15);
    });
  });

  return (
    <group {...bind}>
      {windTurbines.map((pos, i) => (
        <group key={i} position={pos} rotation-y={0.5}>
          <mesh position-y={3.5} castShadow>
            <cylinderGeometry args={[0.07, 0.16, 7, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 7.05, -0.12]} castShadow>
            <boxGeometry args={[0.24, 0.24, 0.6]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.35} />
          </mesh>
          <group position={[0, 7.05, 0.22]} rotation-z={i} ref={el => { rotors.current[i] = el; }}>
            <mesh>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.3} />
            </mesh>
            {[0, 1, 2].map(b => (
              <group key={b} rotation-z={(b * Math.PI * 2) / 3}>
                <mesh position-y={1.35} castShadow>
                  <boxGeometry args={[0.13, 2.6, 0.03]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.35} />
                </mesh>
              </group>
            ))}
          </group>
          <mesh position={[0, 7.22, -0.3]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={[4, 0.2, 0.2]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {hovered && (
        <HoverLabel
          position={[point[0], point[1] + 1, point[2]]}
          title="Wind Turbines"
          subtitle="Clean power at night and in winter"
          color={energyDistrict.color}
        />
      )}
    </group>
  );
}

const BATTERY_SLOTS: Vec3[] = [-1.5, 0, 1.5].flatMap(x => [-1.4, 0, 1.4].map(z => [x, 0, z] as Vec3));

const BATTERY_BLOCK = blockOf('energy-district', 'battery');

function BatteryStorage({ onSelect, animate }: SystemProps) {
  const block = BATTERY_BLOCK;
  const statusMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useEffect(() => () => statusMaterial.dispose(), [statusMaterial]);
  const { hovered, bind } = useSelectable(() => onSelect(energyDistrict));

  useFrame(({ clock }) => {
    const k = animate ? 0.65 + 0.35 * Math.sin(clock.elapsedTime * 2.2) : 0.85;
    statusMaterial.color.setRGB(0.3 * k, 2.6 * k, 3.2 * k);
  });

  return (
    <group position={[block.center[0], PLINTH_HEIGHT, block.center[1]]} {...bind}>
      {BATTERY_SLOTS.map((slot, i) => (
        <group key={i} position={slot}>
          <mesh position-y={0.35} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.7, 0.6]} />
            <meshStandardMaterial color={hovered ? '#f1f5f9' : '#cbd5e1'} metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.55, 0.305]} material={statusMaterial}>
            <boxGeometry args={[1, 0.05, 0.01]} />
          </mesh>
        </group>
      ))}
      {hovered && (
        <HoverLabel
          position={[0, 1.8, 0]}
          title="Battery Storage"
          subtitle="Stores daytime solar for the evening peak"
          color={energyDistrict.color}
        />
      )}
    </group>
  );
}

interface Flow {
  curve: THREE.QuadraticBezierCurve3;
  color: [number, number, number];
}

const toVector = (v: Vec3) => new THREE.Vector3(...v);

function arc(from: Vec3, to: Vec3, lift: number) {
  const a = toVector(from);
  const b = toVector(to);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y = Math.max(a.y, b.y) + lift;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

const ENERGY_COLOR: [number, number, number] = [4, 2.2, 0.35];
const DATA_COLOR: [number, number, number] = [0.35, 2.6, 4];
const PULSES_PER_FLOW = 4;

/** Amber lines carry electricity from the Energy District; cyan lines carry sensor data to the control centre. */
function ConnectionFlows({ animate }: { animate: boolean }) {
  const flows = useMemo<Flow[]>(
    () => [
      ...[hubs.green, hubs.mobility, hubs.human, hubs.control].map(to => ({ curve: arc(hubs.energy, to, 6), color: ENERGY_COLOR })),
      ...[hubs.green, hubs.mobility, hubs.energy, hubs.human].map(from => ({ curve: arc(from, hubs.control, 3), color: DATA_COLOR })),
    ],
    [],
  );
  const pulses = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulseColors = useMemo(() => {
    const color = new THREE.Color();
    const array = new Float32Array(flows.length * PULSES_PER_FLOW * 3);
    flows.forEach((flow, f) => {
      for (let k = 0; k < PULSES_PER_FLOW; k++) color.setRGB(...flow.color).toArray(array, (f * PULSES_PER_FLOW + k) * 3);
    });
    return array;
  }, [flows]);

  useFrame(({ clock }) => {
    const mesh = pulses.current;
    if (!mesh) return;
    const time = animate ? clock.elapsedTime : 0;
    flows.forEach((flow, f) => {
      for (let k = 0; k < PULSES_PER_FLOW; k++) {
        const t = (time * 0.12 + k / PULSES_PER_FLOW + f * 0.07) % 1;
        dummy.position.copy(flow.curve.getPoint(t));
        dummy.updateMatrix();
        mesh.setMatrixAt(f * PULSES_PER_FLOW + k, dummy.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {flows.map((flow, i) => (
        <mesh key={i}>
          <tubeGeometry args={[flow.curve, 64, 0.025, 6, false]} />
          <meshBasicMaterial color={flow.color} transparent opacity={0.28} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, flows.length * PULSES_PER_FLOW]} frustumCulled={false}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <instancedBufferAttribute attach="instanceColor" args={[pulseColors, 3]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export function EnergySystem({ onSelect, animate }: SystemProps) {
  return (
    <group>
      <SolarArrays onSelect={onSelect} />
      <WindFarm onSelect={onSelect} animate={animate} />
      <BatteryStorage onSelect={onSelect} animate={animate} />
      <ConnectionFlows animate={animate} />
    </group>
  );
}
