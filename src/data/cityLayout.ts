import { districts, type District } from './districts';

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const PLINTH_HEIGHT = 0.08;
export const BLOCK_SIZE = 5;
export const BLOCK_STEP = 6.5;
export const AVENUE_HALF_WIDTH = 1.5;
export const STREET_HALF_WIDTH = 0.75;
export const STREET_LINES = [-23, -16.25, -9.75, 9.75, 16.25, 23];
export const CITY_HALF = 23.75;
export const ROUNDABOUT_RADIUS = 4.5;
export const MONORAIL = { half: 16.25, height: 3.4, cornerRadius: 3 };

export type BlockRole =
  | 'buildings'
  | 'park'
  | 'mobility-hub'
  | 'battery'
  | 'solar-farm'
  | 'plaza'
  | 'hospital'
  | 'school';

export interface CityBlock {
  key: string;
  district: District;
  center: Vec2;
  role: BlockRole;
}

export type RoofType = 'plain' | 'garden' | 'solar' | 'antenna';

export interface BuildingSpec {
  key: string;
  district: District;
  position: Vec3;
  size: Vec3;
  label: string;
  roof: RoofType;
  crown: boolean;
  verticalForest: boolean;
  uvSeed: number;
}

export interface InstanceSpec {
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  color?: string;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(2050);
const range = (min: number, max: number) => min + rng() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(rng() * items.length)];

/** Block roles keyed by "inner" coordinates: 0 = column/row closest to the central avenues. */
const ROLE_MAP: Record<string, Record<string, BlockRole>> = {
  'green-core': { '1,1': 'park', '2,2': 'park' },
  'mobility-grid': { '1,1': 'mobility-hub' },
  'energy-district': { '1,1': 'battery', '2,1': 'solar-farm', '1,2': 'solar-farm', '2,2': 'solar-farm' },
  'human-living': { '1,1': 'plaza', '2,0': 'hospital', '0,2': 'school' },
};

const LABELS: Record<string, string[]> = {
  'green-core': ['Vertical Forest Tower', 'Eco Residence', 'Green Office', 'Biodiversity Lab'],
  'mobility-grid': ['Smart Office Tower', 'Transit Operations', 'AI Traffic Centre', 'Co-working Tower'],
  'energy-district': ['Solar Office', 'Energy Research Lab', 'Smart Grid Control', 'Microgrid Housing'],
  'human-living': ['Smart Homes', 'Mixed-Use Housing', 'Community Centre', 'Affordable Apartments'],
};

export const blocks: CityBlock[] = districts.flatMap(district => {
  const [cx, , cz] = district.position;
  const result: CityBlock[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const ii = cx > 0 ? i : 2 - i;
      const jj = cz > 0 ? j : 2 - j;
      const role = ROLE_MAP[district.id]?.[`${ii},${jj}`] ?? 'buildings';
      result.push({
        key: `${district.id}-${i}-${j}`,
        district,
        center: [cx + (i - 1) * BLOCK_STEP, cz + (j - 1) * BLOCK_STEP],
        role,
      });
    }
  }
  return result;
});

export const blockOf = (districtId: string, role: BlockRole) =>
  blocks.find(b => b.district.id === districtId && b.role === role)!;

function makeBuilding(
  block: CityBlock,
  index: number,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  overrides: Partial<BuildingSpec> = {},
): BuildingSpec {
  return {
    key: `${block.key}-${index}`,
    district: block.district,
    position: [x, PLINTH_HEIGHT, z],
    size: [w, h, d],
    label: pick(LABELS[block.district.id]),
    roof: 'plain',
    crown: false,
    verticalForest: false,
    uvSeed: rng(),
    ...overrides,
  };
}

function generateBuildings(): BuildingSpec[] {
  const list: BuildingSpec[] = [];
  for (const block of blocks) {
    const [bx, bz] = block.center;
    const id = block.district.id;

    if (block.role === 'hospital') {
      list.push(makeBuilding(block, 0, bx, bz - 0.3, 3.8, 3.2, 3.4, { label: 'Community Hospital', crown: true }));
      continue;
    }
    if (block.role === 'school') {
      list.push(makeBuilding(block, 0, bx, bz - 1.5, 4, 1.3, 1.5, { label: 'Public School', roof: 'solar' }));
      list.push(makeBuilding(block, 1, bx - 1.2, bz + 0.65, 1.6, 1.3, 2.2, { label: 'Public School', roof: 'garden' }));
      continue;
    }
    if (block.role !== 'buildings') continue;

    // Landmark skyscraper for mobility-grid (more frequent, much taller)
    if (id === 'mobility-grid' && rng() < 0.55) {
      const size = range(2.8, 3.6);
      list.push(
        makeBuilding(block, 0, bx, bz, size, range(28, 44), size, {
          label: 'Smart Office Tower',
          roof: 'antenna',
          crown: true,
        }),
      );
      continue;
    }

    let index = 0;
    for (const ox of [-1.25, 1.25]) {
      for (const oz of [-1.25, 1.25]) {
        // Wider footprints → more imposing presence
        const w = range(1.9, 2.7);
        const d = range(1.9, 2.7);
        const jitterX = range(-0.12, 0.12);
        const jitterZ = range(-0.12, 0.12);
        let h: number;
        let overrides: Partial<BuildingSpec> = {};
        switch (id) {
          case 'green-core': {
            h = range(5, 18);              // was 2.4–8.5
            const forest = h > 10;
            overrides = {
              verticalForest: forest,
              roof: 'garden',
              label: forest ? 'Vertical Forest Tower' : pick(LABELS[id].slice(1)),
            };
            break;
          }
          case 'mobility-grid':
            h = range(10, 24);             // was 5–12.5
            overrides = { roof: h > 18 ? 'antenna' : 'plain', crown: h > 14 };
            break;
          case 'energy-district':
            h = range(3, 8);               // was 1.6–4.6
            overrides = { roof: 'solar', crown: rng() < 0.3 };
            break;
          default:                          // human-living
            h = range(4, 12);              // was 1.8–5
            overrides = { roof: rng() < 0.4 ? 'solar' : rng() < 0.5 ? 'garden' : 'plain' };
        }
        list.push(makeBuilding(block, index++, bx + ox + jitterX, bz + oz + jitterZ, w, h, d, overrides));
      }
    }
  }
  return list;
}

export const buildings = generateBuildings();

const TREE_COLORS = ['#2d8a3e', '#3aaa50', '#22a040', '#4ade80', '#36a44a', '#50c060', '#28b04a', '#60d060'];

export interface TreeSpec {
  position: Vec3;
  scale: number;
  color: string;
}

function generateTrees(): TreeSpec[] {
  const trees: TreeSpec[] = [];
  const add = (x: number, y: number, z: number, scale: number) =>
    trees.push({ position: [x, y, z], scale, color: pick(TREE_COLORS) });

  for (const block of blocks.filter(b => b.role === 'park')) {
    const [bx, bz] = block.center;
    for (let x = -2.1; x <= 2.1; x += 0.7) {
      for (let z = -2.1; z <= 2.1; z += 0.7) {
        if (Math.hypot(x - 0.4, z - 0.3) < 1.35) continue;
        if (rng() < 0.8) add(bx + x + range(-0.18, 0.18), PLINTH_HEIGHT, bz + z + range(-0.18, 0.18), range(0.55, 0.9));
      }
    }
  }

  for (let t = 6; t <= 22.5; t += 2.1) {
    for (const sign of [-1, 1]) {
      for (const side of [-2.75, 2.75]) {
        add(side, 0.05, sign * t, range(0.55, 0.75));
        add(sign * t, 0.05, side, range(0.55, 0.75));
      }
    }
  }

  for (const b of buildings.filter(b => b.roof === 'garden')) {
    const [x, y, z] = b.position;
    const top = y + b.size[1] + 0.06;
    add(x - b.size[0] * 0.2, top, z - b.size[2] * 0.15, 0.38);
    add(x + b.size[0] * 0.22, top, z + b.size[2] * 0.2, 0.32);
  }

  const plaza = blockOf('human-living', 'plaza');
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    add(plaza.center[0] + Math.cos(a) * 2.05, PLINTH_HEIGHT, plaza.center[1] + Math.sin(a) * 2.05, 0.6);
  }

  for (let k = 0; k < 180; k++) {
    const a = rng() * Math.PI * 2;
    const r = range(26.5, 48);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (x < -24 && z > 4 && z < 26) continue;
    add(x, 0.02, z, range(0.7, 1.25));
  }
  return trees;
}

export const trees = generateTrees();

function generateSolarPanels(): InstanceSpec[] {
  const panels: InstanceSpec[] = [];
  const tilt = -0.5;
  for (const b of buildings.filter(b => b.roof === 'solar')) {
    const [x, y, z] = b.position;
    const [w, h, d] = b.size;
    const nx = Math.max(1, Math.floor((w - 0.3) / 0.55));
    const nz = Math.max(1, Math.floor((d - 0.3) / 0.5));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        panels.push({
          position: [x - ((nx - 1) * 0.55) / 2 + i * 0.55, y + h + 0.12, z - ((nz - 1) * 0.5) / 2 + j * 0.5],
          rotation: [tilt, 0, 0],
          scale: [0.48, 0.025, 0.36],
        });
      }
    }
  }
  for (const block of blocks.filter(b => b.role === 'solar-farm')) {
    const [bx, bz] = block.center;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 6; j++) {
        panels.push({
          position: [bx - 1.86 + i * 0.62, PLINTH_HEIGHT + 0.3, bz - 1.9 + j * 0.76],
          rotation: [tilt, 0, 0],
          scale: [0.56, 0.03, 0.52],
        });
      }
    }
  }
  return panels;
}

export const solarPanels = generateSolarPanels();

function generateVerticalForest(): InstanceSpec[] {
  const planters: InstanceSpec[] = [];
  for (const b of buildings.filter(b => b.verticalForest)) {
    const [x, y, z] = b.position;
    const [w, h, d] = b.size;
    let level = 0;
    for (let py = 0.8; py < h - 0.4; py += 0.72, level++) {
      const sides: { pos: Vec3; scale: Vec3 }[] = [
        { pos: [x, y + py, z + d / 2 + 0.09], scale: [w * 0.86, 0.16, 0.2] },
        { pos: [x, y + py, z - d / 2 - 0.09], scale: [w * 0.86, 0.16, 0.2] },
        { pos: [x + w / 2 + 0.09, y + py, z], scale: [0.2, 0.16, d * 0.86] },
        { pos: [x - w / 2 - 0.09, y + py, z], scale: [0.2, 0.16, d * 0.86] },
      ];
      sides.forEach((side, s) => {
        if ((level + s) % 2 === 0 || rng() < 0.45) {
          planters.push({ position: side.pos, scale: side.scale, color: pick(TREE_COLORS) });
        }
      });
    }
  }
  return planters;
}

export const verticalForest = generateVerticalForest();

export const crowns: InstanceSpec[] = buildings
  .filter(b => b.crown)
  .map(b => ({
    position: [b.position[0], b.position[1] + b.size[1] - 0.22, b.position[2]] as Vec3,
    scale: [b.size[0] + 0.05, 0.07, b.size[2] + 0.05] as Vec3,
    color: b.district.color,
  }));

export const antennas = buildings
  .filter(b => b.roof === 'antenna')
  .map(b => [b.position[0], b.position[1] + b.size[1], b.position[2]] as Vec3);

/** Positions along every street (excluding the central avenues) where two streets cross. */
const isNearCrossing = (t: number, margin: number) =>
  Math.abs(t) < AVENUE_HALF_WIDTH + margin || STREET_LINES.some(line => Math.abs(t - line) < STREET_HALF_WIDTH + margin);

export interface StreetSegment {
  axis: 'x' | 'z';
  line: number;
  from: number;
  to: number;
}

function generateStreetLights(): Vec3[] {
  const lights: Vec3[] = [];
  for (let t = 6; t <= 23; t += 3) {
    for (const sign of [-1, 1]) {
      for (const side of [-1.75, 1.75]) {
        lights.push([side, 0, sign * t]);
        lights.push([sign * t, 0, side]);
      }
    }
  }
  for (const line of STREET_LINES) {
    for (let t = -21; t <= 21; t += 4.5) {
      if (isNearCrossing(t, 0.6)) continue;
      const offset = line > 0 ? -0.88 : 0.88;
      lights.push([line + offset, PLINTH_HEIGHT, t]);
      lights.push([t, PLINTH_HEIGHT, line + offset]);
    }
  }
  return lights;
}

export const streetLights = generateStreetLights();

function generateLaneDashes(): InstanceSpec[] {
  const dashes: InstanceSpec[] = [];
  for (const line of STREET_LINES) {
    for (let t = -CITY_HALF + 0.5; t <= CITY_HALF - 0.5; t += 1) {
      if (isNearCrossing(t, 0.3)) continue;
      dashes.push({ position: [line, 0.012, t], scale: [0.05, 0.01, 0.45] });
      dashes.push({ position: [t, 0.012, line], scale: [0.45, 0.01, 0.05] });
    }
  }
  for (let t = ROUNDABOUT_RADIUS + 0.5; t <= CITY_HALF - 0.5; t += 1) {
    if (isNearCrossing(t, 0.3)) continue;
    for (const sign of [-1, 1]) {
      for (const lane of [-0.75, 0.75]) {
        dashes.push({ position: [lane, 0.012, sign * t], scale: [0.05, 0.01, 0.45] });
        dashes.push({ position: [sign * t, 0.012, lane], scale: [0.45, 0.01, 0.05] });
      }
    }
  }
  return dashes;
}

export const laneDashes = generateLaneDashes();

function generateCrossings(): { stripes: InstanceSpec[]; tactile: InstanceSpec[] } {
  const stripes: InstanceSpec[] = [];
  const tactile: InstanceSpec[] = [];
  for (const line of STREET_LINES.filter(l => Math.abs(l) < 20)) {
    for (const side of [-1.25, 1.25]) {
      const at = line + side;
      for (let s = -1.3; s <= 1.31; s += 0.33) {
        stripes.push({ position: [at, 0.014, s], scale: [0.7, 0.01, 0.17] });
        stripes.push({ position: [s, 0.014, at], scale: [0.17, 0.01, 0.7] });
      }
      for (const end of [-1.75, 1.75]) {
        tactile.push({ position: [at, 0.06, end], scale: [0.7, 0.02, 0.3] });
        tactile.push({ position: [end, 0.06, at], scale: [0.3, 0.02, 0.7] });
      }
    }
  }
  return { stripes, tactile };
}

export const crossings = generateCrossings();

/** Elevated loop that links all four districts; stations sit on the rounded corners. */
export function monorailPoints(height = MONORAIL.height): Vec3[] {
  const { half, cornerRadius: r } = MONORAIL;
  const corners: { cx: number; cz: number; start: number }[] = [
    { cx: half - r, cz: half - r, start: 0 },
    { cx: -(half - r), cz: half - r, start: Math.PI / 2 },
    { cx: -(half - r), cz: -(half - r), start: Math.PI },
    { cx: half - r, cz: -(half - r), start: (3 * Math.PI) / 2 },
  ];
  const points: Vec3[] = [];
  for (const c of corners) {
    for (let k = 0; k <= 6; k++) {
      const a = c.start + (k / 6) * (Math.PI / 2);
      points.push([c.cx + Math.cos(a) * r, height, c.cz + Math.sin(a) * r]);
    }
  }
  return points;
}

export type VehicleKind = 'car' | 'shuttle';

export interface TrafficLane {
  from: Vec2;
  to: Vec2;
  vehicles: VehicleKind[];
  speed: number;
}

function generateLanes(): TrafficLane[] {
  const lanes: TrafficLane[] = [];
  const add = (from: Vec2, to: Vec2, vehicles: VehicleKind[], speed: number) =>
    lanes.push({ from, to, vehicles, speed });
  const streetVehicles = (withShuttle: boolean): VehicleKind[] => (withShuttle ? ['car', 'shuttle', 'car'] : ['car', 'car']);

  for (const line of STREET_LINES) {
    const mobilityVertical = line === 9.75 || line === 16.25;
    const mobilityHorizontal = line === -9.75 || line === -16.25;
    add([line + 0.35, -CITY_HALF], [line + 0.35, CITY_HALF], streetVehicles(mobilityVertical), range(2.2, 3));
    add([line - 0.35, CITY_HALF], [line - 0.35, -CITY_HALF], streetVehicles(mobilityVertical), range(2.2, 3));
    add([-CITY_HALF, line - 0.35], [CITY_HALF, line - 0.35], streetVehicles(mobilityHorizontal), range(2.2, 3));
    add([CITY_HALF, line + 0.35], [-CITY_HALF, line + 0.35], streetVehicles(mobilityHorizontal), range(2.2, 3));
  }
  for (const sign of [-1, 1]) {
    const near = sign * ROUNDABOUT_RADIUS;
    const far = sign * CITY_HALF;
    for (const lane of [0.4, 1.1]) {
      const vehicles: VehicleKind[] = lane > 1 ? ['car', 'shuttle'] : ['car', 'car'];
      add([lane * sign, near], [lane * sign, far], vehicles, range(3, 4));
      add([-lane * sign, far], [-lane * sign, near], vehicles, range(3, 4));
      add([near, -lane * sign], [far, -lane * sign], vehicles, range(3, 4));
      add([far, lane * sign], [near, lane * sign], vehicles, range(3, 4));
    }
  }
  return lanes;
}

export const trafficLanes = generateLanes();

export const bikeLanes: InstanceSpec[] = [9.75, 16.25].flatMap(line => [
  { position: [line + 0.62, 0.013, -(CITY_HALF + 1.5) / 2] as Vec3, scale: [0.18, 0.01, CITY_HALF - 1.5] as Vec3 },
  { position: [(CITY_HALF + 1.5) / 2, 0.013, -line - 0.62] as Vec3, scale: [CITY_HALF - 1.5, 0.01, 0.18] as Vec3 },
]);

export const trafficSignals: Vec3[] = [9.75, 16.25].flatMap(x =>
  [-9.75, -16.25].flatMap(z => [
    [x + 0.95, PLINTH_HEIGHT, z + 0.95] as Vec3,
    [x - 0.95, PLINTH_HEIGHT, z - 0.95] as Vec3,
  ]),
);

export const windTurbines: Vec3[] = [
  [-27.5, 0, 7],
  [-30.5, 0, 12],
  [-27.5, 0, 17],
  [-30.5, 0, 22],
  [-22, 0, 28],
  [-14, 0, 29.5],
];

const withY = ([x, z]: Vec2, y: number): Vec3 => [x, y, z];

export const hubs = {
  control: [0, 11.5, 0] as Vec3,
  green: withY(blockOf('green-core', 'park').center, 1.2),
  mobility: withY(blockOf('mobility-grid', 'mobility-hub').center, 1.8),
  energy: withY(blockOf('energy-district', 'battery').center, 1.2),
  human: withY(blockOf('human-living', 'plaza').center, 1.2),
};
