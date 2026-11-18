import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// ─── UV / texture constants (geometry UV scaling) ────────────────────────────
export const WINDOW_COLUMNS = 8;
export const WINDOW_ROWS    = 16;
export const WINDOW_WIDTH   = 0.32;
export const FLOOR_HEIGHT   = 0.36;

// ─── Facade style types ───────────────────────────────────────────────────────
type FacadeStyle = 'glass' | 'concrete' | 'residential';

interface FacadePalette {
  wall:       string;    // solid wall / cladding colour
  band:       string;    // floor separator / spandrel colour
  frame:      string;    // mullion / frame colour
  darkGlass:  string;    // unlit window colour
  lit:        string[];  // lit window colours (picked randomly)
  litRatio:   number;    // fraction of windows that are lit
  tint:       string;    // THREE.Color tint on mesh
  style:      FacadeStyle;
  emissive:   number;    // emissiveIntensity
}

// 3 visual variants per district ─────────────────────────────────────────────
const DISTRICT_PALETTES: Record<string, FacadePalette[]> = {
  'green-core': [
    // Variant 0: glass eco-tower (green tint curtain wall)
    {
      wall: '#1e3d16', band: '#16300e', frame: '#1a3812',
      darkGlass: '#1b3c14', lit: ['#ffe4b0', '#d4f7b0', '#a8f0a0', '#fff3d6'],
      litRatio: 0.68, tint: '#90d090', style: 'glass', emissive: 1.8,
    },
    // Variant 1: concrete eco-office
    {
      wall: '#2a4a1e', band: '#1e3814', frame: '#1a3015',
      darkGlass: '#1e3a15', lit: ['#ffe4b0', '#ffd07a', '#fff3d6', '#c8f0c0'],
      litRatio: 0.60, tint: '#7cb87e', style: 'concrete', emissive: 2.2,
    },
    // Variant 2: residential with plant balconies
    {
      wall: '#3d5a2a', band: '#2a4020', frame: '#243818',
      darkGlass: '#243a1a', lit: ['#ffe8c0', '#ffd890', '#d0f8c0', '#fff3d6'],
      litRatio: 0.58, tint: '#86efac', style: 'residential', emissive: 2.0,
    },
  ],
  'mobility-grid': [
    // Variant 0: full glass tower (blue-grey)
    {
      wall: '#1e3050', band: '#1a2840', frame: '#152035',
      darkGlass: '#0d1f3c', lit: ['#ffe4b0', '#c8e8ff', '#ffffff', '#a0d0ff'],
      litRatio: 0.75, tint: '#93c5fd', style: 'glass', emissive: 2.0,
    },
    // Variant 1: concrete smart-office
    {
      wall: '#252d3f', band: '#1c2535', frame: '#161e2e',
      darkGlass: '#12192a', lit: ['#ffe4b0', '#d0e8ff', '#b8d8ff', '#ffffff'],
      litRatio: 0.70, tint: '#7eb8e8', style: 'concrete', emissive: 2.2,
    },
    // Variant 2: lighter tech campus
    {
      wall: '#38455a', band: '#2d3850', frame: '#252e45',
      darkGlass: '#1e2840', lit: ['#ffe4b0', '#ffd07a', '#cce0ff', '#f0f4ff'],
      litRatio: 0.65, tint: '#a0bedd', style: 'residential', emissive: 2.0,
    },
  ],
  'energy-district': [
    // Variant 0: industrial concrete with amber windows
    {
      wall: '#3d2e0a', band: '#2d2208', frame: '#241c06',
      darkGlass: '#2a2208', lit: ['#ffe4b0', '#ffcc66', '#fff3d6', '#ffe599'],
      litRatio: 0.65, tint: '#fde68a', style: 'concrete', emissive: 2.2,
    },
    // Variant 1: warm brick office
    {
      wall: '#4a3810', band: '#382a0a', frame: '#2c2008',
      darkGlass: '#342a08', lit: ['#ffe8c0', '#ffcc88', '#ffd070', '#fff0d0'],
      litRatio: 0.60, tint: '#f0c060', style: 'residential', emissive: 2.0,
    },
    // Variant 2: glass with solar tint
    {
      wall: '#2e2510', band: '#221c0c', frame: '#1a1508',
      darkGlass: '#241e0a', lit: ['#ffffd0', '#ffe8a0', '#ffef88', '#fff3c0'],
      litRatio: 0.55, tint: '#e8d090', style: 'glass', emissive: 1.8,
    },
  ],
  'human-living': [
    // Variant 0: warm residential brick
    {
      wall: '#3a2810', band: '#2d2010', frame: '#241808',
      darkGlass: '#301f0c', lit: ['#ffe4b0', '#ffcc88', '#ffeacd', '#ffe0c0'],
      litRatio: 0.72, tint: '#fdba74', style: 'residential', emissive: 2.2,
    },
    // Variant 1: mixed-use concrete
    {
      wall: '#4a3818', band: '#3a2a12', frame: '#2d200e',
      darkGlass: '#3a2d10', lit: ['#ffe8c0', '#ffd090', '#ffd8b0', '#ffecd0'],
      litRatio: 0.68, tint: '#f0a060', style: 'concrete', emissive: 2.0,
    },
    // Variant 2: modern apartment glass
    {
      wall: '#2e2218', band: '#241a10', frame: '#1c140c',
      darkGlass: '#28200e', lit: ['#ffe4b0', '#ffd07a', '#fff3d6', '#ffd4a0'],
      litRatio: 0.75, tint: '#e8c090', style: 'glass', emissive: 2.2,
    },
  ],
};

// ─── Seeded random ────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

// ─── Facade texture pair (diffuse + emissive mask) ───────────────────────────
function createFacadeTextures(
  palette: FacadePalette,
  seed: number,
): { diffuse: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const CELL = 48;                    // px per window cell (crisper than the old 32)
  const cols = WINDOW_COLUMNS;
  const rows = WINDOW_ROWS;
  const W = cols * CELL;
  const H = rows * CELL;

  // ─── Diffuse canvas ───────────────────────────────────────────────────────
  const dCanvas = document.createElement('canvas');
  dCanvas.width  = W;
  dCanvas.height = H;
  const dc = dCanvas.getContext('2d')!;

  // ─── Emissive mask canvas (black = no glow, coloured = glow) ─────────────
  const eCanvas = document.createElement('canvas');
  eCanvas.width  = W;
  eCanvas.height = H;
  const ec = eCanvas.getContext('2d')!;

  const rng = seededRandom(seed);

  // Fill wall
  dc.fillStyle = palette.wall;
  dc.fillRect(0, 0, W, H);
  ec.fillStyle = '#000000';
  ec.fillRect(0, 0, W, H);

  // Floor separator bands (concrete / residential styles)
  if (palette.style !== 'glass') {
    const bandH = palette.style === 'residential' ? 6 : 5;
    dc.fillStyle = palette.band;
    for (let r = 0; r <= rows; r++) dc.fillRect(0, r * CELL, W, bandH);
  } else {
    // Glass curtain-wall: thin aluminium mullion grid
    dc.fillStyle  = palette.frame;
    dc.globalAlpha = 0.85;
    for (let c = 0; c <= cols; c++) dc.fillRect(c * CELL, 0, 1.5, H);
    for (let r = 0; r <= rows; r++) dc.fillRect(0, r * CELL, W, 1.5);
    dc.globalAlpha = 1;
    // Faint reflection on mullions in emissive map
    ec.fillStyle  = palette.frame;
    ec.globalAlpha = 0.06;
    for (let c = 0; c <= cols; c++) ec.fillRect(c * CELL, 0, 1.5, H);
    for (let r = 0; r <= rows; r++) ec.fillRect(0, r * CELL, W, 1.5);
    ec.globalAlpha = 1;
  }

  // Windows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let wx: number, wy: number, ww: number, wh: number;

      switch (palette.style) {
        case 'glass':
          wx = c * CELL + 2;  wy = r * CELL + 2;  ww = CELL - 4;  wh = CELL - 4;
          break;
        case 'concrete':
          wx = c * CELL + 7;  wy = r * CELL + 7;  ww = CELL - 14; wh = CELL - 11;
          break;
        default: // residential
          wx = c * CELL + 10; wy = r * CELL + 9;  ww = CELL - 20; wh = CELL - 15;
      }

      const isLit = rng() < palette.litRatio;
      const litColour = palette.lit[Math.floor(rng() * palette.lit.length)];
      const winColour = isLit ? litColour : palette.darkGlass;

      // ── Diffuse window ──────────────────────────────────────────────────
      dc.globalAlpha = isLit ? 0.85 + rng() * 0.15 : 0.95;
      dc.fillStyle   = winColour;
      dc.fillRect(wx, wy, ww, wh);

      // Window frame border (non-glass)
      if (palette.style !== 'glass') {
        dc.strokeStyle = palette.frame;
        dc.lineWidth   = 1.5;
        dc.globalAlpha = 0.55;
        dc.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
      }

      // Spandrel for glass buildings (bottom 25 % of each panel = opaque)
      if (palette.style === 'glass') {
        const spanH = Math.floor(wh * 0.26);
        dc.fillStyle   = palette.band;
        dc.globalAlpha = 0.72;
        dc.fillRect(wx, wy + wh - spanH, ww, spanH);
      }

      // Occasional balcony shadow line (residential)
      if (palette.style === 'residential' && rng() < 0.22) {
        dc.fillStyle   = 'rgba(0,0,0,0.25)';
        dc.globalAlpha = 1;
        dc.fillRect(wx - 1, wy - 3, ww + 2, 2);
      }

      dc.globalAlpha = 1;

      // ── Emissive mask (only lit windows glow) ──────────────────────────
      if (isLit) {
        ec.globalAlpha = 0.88;
        ec.fillStyle   = litColour;
        ec.fillRect(wx, wy, ww, wh);
        // Spandrel must NOT glow
        if (palette.style === 'glass') {
          const spanH = Math.floor(wh * 0.26);
          ec.fillStyle   = '#000000';
          ec.globalAlpha = 1;
          ec.fillRect(wx, wy + wh - spanH, ww, spanH);
        }
      }
      ec.globalAlpha = 1;
    }
  }

  const makeTexture = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS      = THREE.RepeatWrapping;
    t.wrapT      = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };

  return { diffuse: makeTexture(dCanvas), emissive: makeTexture(eCanvas) };
}

// ─── Public types ──────────────────────────────────────────────────────────────
export interface DistrictMaterialVariant {
  base:  THREE.MeshStandardMaterial;
  hover: THREE.MeshStandardMaterial;
}

export interface DistrictMaterials extends DistrictMaterialVariant {
  /** Pick one of three visual variants using a building's uvSeed (0-1). */
  variant(uvSeed: number): DistrictMaterialVariant;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDistrictMaterials(): Record<string, DistrictMaterials> {
  const materials = useMemo(() => {
    const result: Record<string, DistrictMaterials> = {};

    Object.entries(DISTRICT_PALETTES).forEach(([id, palettes]) => {
      // Build 3 variants
      const variants: DistrictMaterialVariant[] = palettes.map((palette, vi) => {
        const { diffuse, emissive } = createFacadeTextures(palette, 97 + vi * 73 + palettes.indexOf(palette) * 31);

        const makeMat = (emInt: number) =>
          new THREE.MeshStandardMaterial({
            map:              diffuse,
            emissiveMap:      emissive,
            emissive:         new THREE.Color('#ffffff'),
            emissiveIntensity: emInt,
            color:            new THREE.Color(palette.tint),
            metalness:        palette.style === 'glass' ? 0.60 : 0.22,
            roughness:        palette.style === 'glass' ? 0.12 : (palette.style === 'concrete' ? 0.72 : 0.80),
            envMapIntensity:  palette.style === 'glass' ? 1.6 : 0.5,
          });

        const base  = makeMat(palette.emissive);
        const hover = makeMat(palette.emissive * 1.6);
        hover.color = new THREE.Color('#ffffff');
        return { base, hover };
      });

      result[id] = {
        // Default (backward-compat for Landmarks etc.)
        base:  variants[0].base,
        hover: variants[0].hover,
        // Per-building selection
        variant: (uvSeed: number) => variants[Math.floor(uvSeed * 3) % 3],
      };
    });

    return result;
  }, []);

  useEffect(
    () => () => {
      Object.values(materials).forEach(({ base, hover, variant }) => {
        const cleanup = (m: THREE.MeshStandardMaterial) => {
          m.map?.dispose();
          m.emissiveMap?.dispose();
          m.dispose();
        };
        cleanup(base);
        cleanup(hover);
        [0, 0.5, 0.9].forEach(s => {
          const v = variant(s);
          if (v.base !== base) { cleanup(v.base); cleanup(v.hover); }
        });
      });
    },
    [materials],
  );

  return materials;
}

// ─── Building geometry with UV-mapped facade ──────────────────────────────────
export function createBuildingGeometry(
  width: number,
  height: number,
  depth: number,
  uvSeed: number,
) {
  const geometry  = new THREE.BoxGeometry(width, height, depth);
  const uv        = geometry.attributes.uv as THREE.BufferAttribute;
  const colsFor   = (span: number) => Math.max(1, Math.round(span / WINDOW_WIDTH)) / WINDOW_COLUMNS;
  const rows       = Math.max(1, Math.round(height / FLOOR_HEIGHT)) / WINDOW_ROWS;
  const uOffset   = Math.floor(uvSeed * WINDOW_COLUMNS) / WINDOW_COLUMNS;
  const vOffset   = (Math.floor(uvSeed * 97) % WINDOW_ROWS) / WINDOW_ROWS;

  for (let face = 0; face < 6; face++) {
    const isRoof = face === 2 || face === 3;
    const uScale = face < 2 ? colsFor(depth) : colsFor(width);
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      if (isRoof) {
        uv.setXY(i, 0, 0);
      } else {
        uv.setXY(i, uv.getX(i) * uScale + uOffset, uv.getY(i) * rows + vOffset);
      }
    }
  }
  uv.needsUpdate = true;
  return geometry;
}
