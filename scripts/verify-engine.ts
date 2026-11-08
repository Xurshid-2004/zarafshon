// Proportion + collision check for the procedural tower layout.
//   npx tsx scripts/verify-engine.ts
// Exits with code 1 if any hard rule fails.

import { ARCH } from '@/lib/architecture';
import { BUILDINGS } from '@/lib/buildingConfig';
import { allBoxes, buildTowerLayout, slotsFromBuilding, type Box } from '@/components/engine/layout';

type AABB = { min: number[]; max: number[] };
const aabb = (b: Box, off: number[] = [0, 0, 0]): AABB => ({
  min: b.p.map((v, i) => v - b.s[i] / 2 + off[i]),
  max: b.p.map((v, i) => v + b.s[i] / 2 + off[i]),
});
const hit = (a: AABB, b: AABB, eps = 1e-3) =>
  [0, 1, 2].every((i) => a.min[i] < b.max[i] - eps && a.max[i] > b.min[i] + eps);
const merge = (list: AABB[]): AABB => ({
  min: [0, 1, 2].map((i) => Math.min(...list.map((b) => b.min[i]))),
  max: [0, 1, 2].map((i) => Math.max(...list.map((b) => b.max[i]))),
});
const f = (n: number) => n.toFixed(2);

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${msg}`);
  if (!ok) failures++;
};

const worldBounds: Record<string, AABB> = {};

for (const data of BUILDINGS) {
  const spec = ARCH.towers.find((t) => t.id === data.id)!;
  const L = buildTowerLayout(spec, slotsFromBuilding(data));
  const all = allBoxes(L);
  const FH = ARCH.floorHeight;

  console.log(`\n=== Tower ${spec.id}: ${spec.floors} floors, ${spec.width} x ${spec.depth} m ===`);

  // sizes are real
  const bad = all.filter(({ box }) => box.s.some((v) => !(v > 0)) || box.p.some((v) => !Number.isFinite(v)));
  check(bad.length === 0, `all ${all.length} boxes have positive finite size` + (bad.length ? ` (bad: ${bad[0].group})` : ''));

  // heights
  const expected = spec.floors * FH + ARCH.roof.slab;
  check(Math.abs(L.height - expected) < 1e-6, `roof slab top = ${f(L.height)} m (${spec.floors} x ${FH} + ${ARCH.roof.slab})`);
  const above = all.filter(({ box }) => box.level > 0).map(({ box }) => aabb(box));
  const bb = merge(above);
  console.log(
    `  bounds above ground: x ${f(bb.min[0])}..${f(bb.max[0])}  y ${f(bb.min[1])}..${f(bb.max[1])}  z ${f(bb.min[2])}..${f(bb.max[2])}`,
  );
  check(bb.min[1] >= -1e-6, 'nothing above-ground pokes below y = 0');
  const slender = L.height / spec.width;
  console.log(`  slenderness (height / width) = ${f(slender)}, height / depth = ${f(L.height / spec.depth)}`);

  // every storey has a slab at the right height
  check(L.slabs.length === spec.floors, `${L.slabs.length} slabs for ${spec.floors} storeys`);
  check(
    L.slabs.every((s) => Math.abs(s.p[1] - ((s.level - 1) * FH + ARCH.slab / 2)) < 1e-6),
    'each slab sits at (level - 1) x floor height',
  );

  // vision glass never overlaps the opaque spandrel of its storey
  const glass = [...L.windows.glass, ...L.windows.shopGlass];
  const spand = L.facade.spandrels;
  const glassHits = glass.filter((g) => spand.some((s) => hit(aabb(g), aabb(s))));
  check(glassHits.length === 0, `glass panes clear of spandrels (${glass.length} panes)`);

  // glazing coverage on a typical residential storey
  const typical = 2;
  const glazedArea = L.windows.glass
    .filter((g) => g.level === typical)
    .reduce((a, g) => a + Math.max(g.s[0], g.s[2]) * g.s[1], 0);
  const wallArea = 2 * (spec.width + spec.depth) * FH;
  const ratio = glazedArea / wallArea;
  console.log(`  window-to-wall ratio, level ${typical}: ${(ratio * 100).toFixed(0)} %`);
  check(ratio > 0.55 && ratio < 0.9, 'window-to-wall ratio in a believable curtain-wall range (55-90 %)');

  // balconies: one per flagged unit, never cut by a fin
  const flagged = data.floors.flatMap((fl) => fl.apartments).filter((a) => a.balcony).length;
  check(L.balconies.slabs.length === flagged, `${L.balconies.slabs.length} balconies = ${flagged} units flagged with a balcony`);
  const finHits = L.balconies.slabs.filter((b) =>
    L.facade.fins.some((fn) => fn.level === b.level && hit(aabb(b), aabb(fn))),
  );
  check(finHits.length === 0, 'no fin passes through a balcony');
  const bal = L.balconies.slabs.map((b) => aabb(b));
  if (bal.length) {
    const bb2 = merge(bal);
    console.log(`  balconies project ${f(bb2.max[2] - spec.depth / 2)} m from the front facade`);
  }

  // columns stand between the glass and the interior volume, and never in the core
  const core = L.structure.core.map((c) => aabb(c));
  const colInCore = L.structure.columns.filter((c) => core.some((k) => hit(aabb(c), k)));
  check(colInCore.length === 0, `${L.structure.columns.length} columns, none inside the service core`);
  const insideFoot = L.structure.columns.every(
    (c) => Math.abs(c.p[0]) < spec.width / 2 && Math.abs(c.p[2]) < spec.depth / 2,
  );
  check(insideFoot, 'every column inside the footprint');

  // the entrance lobby is clear
  const lobby = L.entrance.glass.map((g) => aabb(g));
  const colInLobby = L.structure.columns.filter((c) => c.level === 1 && lobby.some((g) => hit(aabb(c), g)));
  check(colInLobby.length === 0, 'no column blocks the entrance door screen');
  const paneInDoor = L.windows.shopGlass.filter((g) => lobby.some((d) => hit(aabb(g), d)));
  check(paneInDoor.length === 0, 'shopfront glass does not cross the entrance');
  const stepTop = Math.max(...L.entrance.steps.map((s) => s.p[1] + s.s[1] / 2));
  check(Math.abs(stepTop - ARCH.slab) < 1e-6, `top step meets the ground-floor slab at ${f(stepTop)} m`);

  // human scale
  const clear = FH - ARCH.slab - ARCH.curtainWall.spandrelBelow;
  console.log(`  clear ceiling height ~ ${f(clear)} m, balcony rail ${ARCH.balcony.railHeight} m`);
  check(clear > 2.4 && clear < 3.2, 'residential clear height between 2.4 and 3.2 m');
  check(ARCH.balcony.railHeight >= 1.0, 'balcony guard rail at least 1.0 m high');

  // instance budget
  const groups = new Map<string, number>();
  for (const { group } of all) groups.set(group, (groups.get(group) ?? 0) + 1);
  console.log(`  ${groups.size} instanced draw groups, ${all.length} instances total`);

  worldBounds[spec.id] = merge(all.filter(({ box }) => box.level > 0).map(({ box }) => aabb(box, spec.position)));
}

console.log('\n=== Site ===');
const a = worldBounds.A;
const b = worldBounds.B;
check(!hit(a, b), 'the two towers (incl. balconies and canopies) do not intersect');
const gap = b.min[0] - a.max[0];
console.log(`  clear gap between towers: ${f(gap)} m`);
check(gap >= 8, 'at least 8 m between towers for the courtyard spine');
const hA = a.max[1];
const hB = b.max[1];
console.log(`  heights incl. parapet: A ${f(hA)} m, B ${f(hB)} m, ratio ${f(hB / hA)}`);

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
