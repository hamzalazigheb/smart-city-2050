import { useEffect, useMemo } from 'react';
import type { BuildingSpec } from '../../data/cityLayout';
import type { District } from '../../data/districts';
import { createBuildingGeometry, type DistrictMaterials } from './cityMaterials';
import { HoverLabel, useSelectable } from './Selectable';

interface Props {
  spec: BuildingSpec;
  materials: DistrictMaterials;
  onSelect: (d: District) => void;
}

export function Building({ spec, materials, onSelect }: Props) {
  const [w, h, d] = spec.size;
  const [x, y, z] = spec.position;
  const { hovered, bind } = useSelectable(() => onSelect(spec.district));

  // ── Per-building material variant (glass / concrete / residential) ─────────
  const matVariant = materials.variant(spec.uvSeed);
  const mat = hovered ? matVariant.hover : matVariant.base;

  // ── Podium + tower breakdown ───────────────────────────────────────────────
  // Buildings taller than 7 units get a wider podium base + narrower tower.
  // This creates the classic NYC/Hong Kong setback skyline silhouette.
  const hasPodium  = h > 7;
  const podiumH    = hasPodium ? Math.min(3.0, h * 0.22) : 0;
  const towerH     = h - podiumH;
  // Tower is 72 % of footprint — visible setback step
  const towerW     = hasPodium ? w * 0.72 : w;
  const towerD     = hasPodium ? d * 0.72 : d;

  const podiumGeo = useMemo(
    () => (hasPodium ? createBuildingGeometry(w, podiumH, d, spec.uvSeed) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w, podiumH, d, spec.uvSeed, hasPodium],
  );
  const towerGeo = useMemo(
    () => createBuildingGeometry(towerW, towerH, towerD, spec.uvSeed + 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [towerW, towerH, towerD, spec.uvSeed],
  );

  useEffect(
    () => () => {
      podiumGeo?.dispose();
      towerGeo.dispose();
    },
    [podiumGeo, towerGeo],
  );

  return (
    <group>
      {/* Podium — full footprint, lower section */}
      {hasPodium && podiumGeo && (
        <mesh
          geometry={podiumGeo}
          material={mat}
          position={[x, y + podiumH / 2, z]}
          castShadow
          receiveShadow
          {...bind}
        />
      )}

      {/* Tower — narrower, the remaining height */}
      <mesh
        geometry={towerGeo}
        material={mat}
        position={[x, y + podiumH + towerH / 2, z]}
        castShadow
        receiveShadow
        {...bind}
      />

      {hovered && (
        <HoverLabel
          position={[x, y + h + 0.7, z]}
          title={spec.label}
          subtitle={`${spec.district.name} · click for details`}
          color={spec.district.color}
        />
      )}
    </group>
  );
}
