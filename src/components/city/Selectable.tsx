import { useEffect, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Vec3 } from '../../data/cityLayout';

/** Hover state, pointer cursor and click handling for any clickable 3D object. */
export function useSelectable(onSelect?: () => void) {
  const [hovered, setHovered] = useState(false);
  const [point, setPoint] = useState<Vec3>([0, 0, 0]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const bind = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      setPoint([e.point.x, e.point.y, e.point.z]);
    },
    onPointerOut: () => setHovered(false),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect?.();
    },
  };

  return { hovered, point, bind };
}

interface LabelProps {
  position: Vec3;
  title: string;
  subtitle?: string;
  color: string;
}

export function HoverLabel({ position, title, subtitle, color }: LabelProps) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(5,13,26,0.92)',
          border: `1px solid ${color}88`,
          borderRadius: 8,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          transform: 'translateY(-24px)',
          boxShadow: `0 0 18px ${color}33`,
        }}
      >
        <div style={{ color, fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: '0.08em' }}>{title}</div>
        {subtitle && <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </Html>
  );
}
