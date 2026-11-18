import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLINTH_HEIGHT, blockOf, buildings } from '../../data/cityLayout';
import { districts, type District } from '../../data/districts';
import type { DistrictMaterials } from './cityMaterials';
import { HoverLabel, useSelectable } from './Selectable';

const byId = (id: string) => districts.find(d => d.id === id)!;
const TOWER_HEIGHT = 12;

interface ControlCentreProps {
  material: THREE.Material;
  onSelect: () => void;
  animate: boolean;
}

function ControlCentre({ material, onSelect, animate }: ControlCentreProps) {
  const halo = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  const { hovered, bind } = useSelectable(onSelect);
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.8, 1.25, TOWER_HEIGHT, 32, 1);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 2);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, delta) => {
    if (halo.current && animate) halo.current.rotation.y += delta * 0.25;
    if (beacon.current) {
      const on = !animate || Math.sin(clock.elapsedTime * 3) > 0;
      beacon.current.color.setRGB(on ? 4 : 0.4, on ? 0.3 : 0.05, on ? 0.3 : 0.05);
    }
  });

  return (
    <group {...bind}>
      <mesh position-y={0.35} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.4, 0.6, 48]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh geometry={geometry} material={material} position-y={TOWER_HEIGHT / 2 + 0.6} castShadow />
      {[3.5, 6.5, 9.5].map((y, i) => (
        <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.22 - i * 0.12, 0.04, 8, 48]} />
          <meshBasicMaterial color={hovered ? [1, 4, 5] : [0.4, 2.4, 3.4]} toneMapped={false} />
        </mesh>
      ))}
      <mesh position-y={TOWER_HEIGHT + 0.85}>
        <cylinderGeometry args={[0.95, 0.85, 0.5, 32]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.6} metalness={0.6} roughness={0.1} />
      </mesh>
      <mesh position-y={TOWER_HEIGHT + 2.3}>
        <coneGeometry args={[0.09, 2.4, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position-y={TOWER_HEIGHT + 3.55}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshBasicMaterial ref={beacon} toneMapped={false} />
      </mesh>
      <mesh ref={halo} position-y={TOWER_HEIGHT + 0.3} rotation-x={0.25}>
        <torusGeometry args={[2, 0.015, 6, 96]} />
        <meshBasicMaterial color={[0.4, 2.6, 3.6]} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      {hovered && (
        <HoverLabel
          position={[0, TOWER_HEIGHT + 4.4, 0]}
          title="City Control Centre"
          subtitle="AI analyses data · human operators decide"
          color="#00f0ff"
        />
      )}
    </group>
  );
}

const HUB_BLOCK = blockOf('mobility-grid', 'mobility-hub');
const PLAZA_BLOCK = blockOf('human-living', 'plaza');
const SCHOOL_BLOCK = blockOf('human-living', 'school');
const HOSPITAL = buildings.find(b => b.label === 'Community Hospital')!;

function MobilityHub({ onSelect }: { onSelect: (d: District) => void }) {
  const district = byId('mobility-grid');
  const { hovered, bind } = useSelectable(() => onSelect(district));
  return (
    <group position={[HUB_BLOCK.center[0], PLINTH_HEIGHT, HUB_BLOCK.center[1]]} {...bind}>
      <mesh position-y={0.55} castShadow receiveShadow>
        <boxGeometry args={[4.2, 1.1, 2.8]} />
        <meshStandardMaterial
          color="#1d4ed8"
          transparent
          opacity={0.55}
          metalness={0.9}
          roughness={0.05}
          emissive="#3b82f6"
          emissiveIntensity={hovered ? 1.4 : 0.55}
        />
      </mesh>
      <mesh position-y={1.1} rotation-z={Math.PI / 2} scale={[1, 1, 0.55]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 4.3, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {[-1.6, -0.8, 0, 0.8, 1.6].map(x => (
        <mesh key={x} position={[x, 0.08, 1.75]}>
          <boxGeometry args={[0.5, 0.04, 0.3]} />
          <meshBasicMaterial color={[0.3, 3, 0.8]} toneMapped={false} />
        </mesh>
      ))}
      {hovered && (
        <HoverLabel
          position={[0, 2.6, 0]}
          title="Mobility Hub"
          subtitle="Buses, shuttles, bikes & monorail in one place"
          color={district.color}
        />
      )}
    </group>
  );
}

function HospitalMarker() {
  const [x, y, z] = HOSPITAL.position;
  const top = y + HOSPITAL.size[1] + 0.03;
  return (
    <group position={[x, top, z]}>
      <mesh>
        <boxGeometry args={[1, 0.03, 0.3]} />
        <meshBasicMaterial color={[4, 0.3, 0.3]} toneMapped={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.3, 0.03, 1]} />
        <meshBasicMaterial color={[4, 0.3, 0.3]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SchoolField() {
  const [bx, bz] = SCHOOL_BLOCK.center;
  const lines: [number, number, number, number][] = [
    [0, -0.95, 2.3, 0.04],
    [0, 0.95, 2.3, 0.04],
    [-1.15, 0, 0.04, 1.9],
    [1.15, 0, 0.04, 1.9],
    [0, 0, 0.04, 1.9],
  ];
  return (
    <group position={[bx + 1.05, PLINTH_HEIGHT + 0.01, bz + 1.1]}>
      <mesh receiveShadow>
        <boxGeometry args={[2.4, 0.02, 2]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
      {lines.map(([lx, lz, w, d], i) => (
        <mesh key={i} position={[lx, 0.015, lz]}>
          <boxGeometry args={[w, 0.01, d]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </group>
  );
}

function PublicPlaza({ onSelect, animate }: { onSelect: (d: District) => void; animate: boolean }) {
  const district = byId('human-living');
  const jet = useRef<THREE.Mesh>(null);
  const { hovered, bind } = useSelectable(() => onSelect(district));

  useFrame(({ clock }) => {
    if (jet.current && animate) jet.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 2.4) * 0.15;
  });

  return (
    <group position={[PLAZA_BLOCK.center[0], PLINTH_HEIGHT, PLAZA_BLOCK.center[1]]} {...bind}>
      <mesh position-y={0.01} receiveShadow>
        <cylinderGeometry args={[2.4, 2.4, 0.02, 64]} />
        <meshStandardMaterial color={hovered ? '#4b5563' : '#3a4150'} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position-y={0.14} castShadow>
        <torusGeometry args={[0.8, 0.09, 8, 40]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.5} />
      </mesh>
      <mesh position-y={0.1}>
        <cylinderGeometry args={[0.76, 0.76, 0.04, 40]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={0.8} metalness={0.8} roughness={0.05} />
      </mesh>
      <mesh ref={jet} position-y={0.5}>
        <cylinderGeometry args={[0.03, 0.07, 0.8, 8]} />
        <meshBasicMaterial color={[0.8, 2.6, 3.4]} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, 0.07, Math.sin(a) * 1.5]} rotation-y={-a} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.45]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        );
      })}
      {hovered && (
        <HoverLabel
          position={[0, 1.6, 0]}
          title="Public Plaza"
          subtitle="Step-free, shaded space for everyone"
          color={district.color}
        />
      )}
    </group>
  );
}

interface LandmarksProps {
  materials: Record<string, DistrictMaterials>;
  onSelect: (d: District) => void;
  onControlCentre: () => void;
  animate: boolean;
}

export function Landmarks({ materials, onSelect, onControlCentre, animate }: LandmarksProps) {
  return (
    <group>
      <ControlCentre material={materials['mobility-grid'].base} onSelect={onControlCentre} animate={animate} />
      <MobilityHub onSelect={onSelect} />
      <HospitalMarker />
      <SchoolField />
      <PublicPlaza onSelect={onSelect} animate={animate} />
    </group>
  );
}
