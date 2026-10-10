// Generates public/game/office.tmj, a standard Tiled JSON map built from the Kenney
// tilesets (see CREDITS.md). Run: node scripts/build-map.mjs
// Open the output in Tiled to tweak the layout by hand if you like.
import { writeFileSync } from "node:fs";

const W = 40, H = 28;
const RPG = 1, IN = 1 + 57 * 31; // firstgid of each tileset
const R = (i) => RPG + i, I = (i) => IN + i;

const layer = () => new Array(W * H).fill(0);
const floor = layer(), rugs = layer(), walls = layer(), deco = layer(), furniture = layer(), collision = layer();
const set = (l, x, y, gid) => { if (x >= 0 && y >= 0 && x < W && y < H) l[y * W + x] = gid; };
const solid = (x, y) => set(collision, x, y, R(0) /* any gid; the layer is hidden */);
const fill = (l, x0, y0, x1, y1, gid) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(l, x, y, gid); };
const wall = (x, y, i) => { set(walls, x, y, R(i)); solid(x, y); };
/** Place a block of tiles (rows of tileset indices; null = skip) and optionally mark it solid. */
const put = (x, y, rows, { block = true, l = furniture, gid = I } = {}) =>
  rows.forEach((row, dy) => row.forEach((i, dx) => { if (i == null) return; set(l, x + dx, y + dy, gid(i)); if (block) solid(x + dx, y + dy); }));

// ---- Floors: wood planks everywhere, parquet lounge, light stone meeting room
fill(floor, 0, 0, W - 1, H - 1, R(123));
fill(floor, 1, 3, 19, 10, R(119));
fill(floor, 21, 3, 38, 10, R(121));

// ---- Outer walls (cap row + two rows of wall face along the top)
wall(0, 0, 700); wall(W - 1, 0, 701);
for (let x = 1; x < W - 1; x++) { wall(x, 0, 698); wall(x, 1, 873); wall(x, 2, 868); }
for (let y = 1; y < H - 1; y++) { wall(0, y, 756); wall(W - 1, y, 756); }
wall(0, H - 1, 757); wall(W - 1, H - 1, 758);
for (let x = 1; x < W - 1; x++) wall(x, H - 1, 698);

// ---- Divider between lounge and meeting room
for (let y = 1; y <= 10; y++) wall(20, y, 756);

// ---- Wall between the rooms and the hall, with two doorways
const DOORS = [[8, 10], [29, 31]];
const segments = [[1, 7], [11, 28], [32, 38]];
for (const [a, b] of segments) {
  for (let x = a; x <= b; x++) {
    const freeL = x === a && a !== 1, freeR = x === b && b !== W - 2;
    wall(x, 11, freeL ? 697 : freeR ? 699 : 698);
    wall(x, 12, freeL ? 872 : freeR ? 874 : 873);
    wall(x, 13, freeL ? 869 : freeR ? 871 : 868);
  }
}

// ---- Wall decorations: arched windows on the top wall, framed pictures in the hall
for (const x of [4, 9, 14, 25, 30, 35]) { put(x, 1, [[158], [215]], { block: false, l: deco, gid: R }); }
for (const [x, i] of [[4, 340], [15, 341], [24, 342], [35, 340]]) put(x, 12, [[i]], { block: false, l: deco });

// ---- Lounge: piano, sofas around a rug, plants, a small table with chairs
put(2, 3, [[239, 240], [266, 267]]);
put(6, 3, [[347, 348], [374, 375]]);
put(10, 3, [[347, 348], [374, 375]]);
put(6, 6, [[1093, 1094, 1094, 1094, 1094, 1095], [1150, 1151, 1151, 1151, 1151, 1152], [1207, 1208, 1208, 1208, 1208, 1209]], { block: false, l: rugs, gid: R });
put(8, 7, [[7]]); put(9, 7, [[7]]);
put(14, 6, [[3, 4]]);
put(14, 5, [[54, 54]], { block: false }); put(14, 7, [[55, 55]], { block: false });
put(13, 6, [[56]], { block: false }); put(16, 6, [[57]], { block: false });
for (const [x, y] of [[1, 10], [18, 3], [18, 10]]) put(x, y, [[16]]);

// ---- Cinema: screen on the north wall, two rows of seats facing it, a center aisle
put(26, 3, [[347, 348, 347, 348, 347, 348], [374, 375, 374, 375, 374, 375]], { block: true, l: furniture });
for (const x of [23, 25, 27, 33, 35, 37]) {
  put(x, 6, [[55]], { block: false });
  put(x, 8, [[55]], { block: false });
}
for (const [x, y] of [[21, 3], [38, 3], [21, 10], [38, 10]]) put(x, y, [[17]]);

// ---- Café, west hall only. The east hall stays open for the arcade.
for (const [x, y] of [[5, 17], [11, 17], [5, 22], [11, 22]]) {
  put(x, y, [[7]]);
  put(x - 1, y, [[98]], { block: false }); put(x + 1, y, [[98]], { block: false });
  put(x, y - 1, [[97]], { block: false }); put(x, y + 1, [[99]], { block: false });
}
put(16, 17, [
  [922, 923, 923, 923, 923, 923, 923, 924],
  [979, 980, 980, 980, 980, 980, 980, 981],
  [979, 980, 980, 980, 980, 980, 980, 981],
  [979, 980, 980, 980, 980, 980, 980, 981],
  [979, 980, 980, 980, 980, 980, 980, 981],
  [1036, 1037, 1037, 1037, 1037, 1037, 1037, 1038],
], { block: false, l: rugs, gid: R });
for (const [x, y] of [[1, 14], [1, 26], [15, 14], [24, 14], [38, 26]]) put(x, y, [[16 + ((x + y) % 2)]]);

// Arcade bay, east of the cinema door so the doorway stays a clear corridor.
// Two cabinets are drawn in Phaser; these tiles are only their footprints.
put(33, 18, [
  [922, 923, 923, 923, 923, 924],
  [979, 980, 980, 980, 980, 981],
  [1036, 1037, 1037, 1037, 1037, 1038],
], { block: false, l: rugs, gid: R });
for (const [x, y] of [[33, 15], [34, 15], [35, 15], [33, 16], [34, 16], [35, 16], [33, 17], [34, 17], [35, 17], [36, 15], [37, 15], [38, 15], [36, 16], [37, 16], [38, 16], [36, 17], [37, 17], [38, 17]]) solid(x, y);

// ---- Objects: spawn, floor labels, interactive zones (pixels)
let oid = 1;
const obj = (name, type, x, y, props = []) => ({ id: oid++, name, type, x, y, width: 0, height: 0, point: true, rotation: 0, visible: true, properties: props });
const zone = (name, x, y, w, h) => ({ id: oid++, name, type: "zone", x, y, width: w, height: h, rotation: 0, visible: true, properties: [] });
const booth = (name, x, y) => ({ id: oid++, name, type: "booth", x, y, width: 48, height: 64, rotation: 0, visible: true, properties: [] });
const objects = [
  obj("spawn", "spawn", 19.5 * 16, 24.5 * 16),
  obj("Lounge", "label", 10 * 16, 9.4 * 16),
  obj("Cinema", "label", 30 * 16, 10 * 16),
  obj("Café", "label", 8 * 16, 25.2 * 16),
  obj("Arcade", "label", 35.5 * 16, 21.4 * 16),
  obj("Ranks", "label", 30 * 16, 23.2 * 16),
  booth("pattern", 33 * 16, 15 * 16),
  booth("momo", 36 * 16, 15 * 16),
  obj("HOWL STUDIO", "label", 20 * 16, 16.2 * 16),
  // Seats and screen only. The east door (tiles 29–31) stays outside this box.
  zone("cinema", 21 * 16, 3 * 16, 18 * 16, 8 * 16),
  // One machine, one standing tile. The cinema door corridor (x 29–31) is left clear.
  zone("arcade", 33 * 16, 19 * 16, 3 * 16, 2 * 16),
  zone("momo", 36 * 16, 19 * 16, 3 * 16, 2 * 16),
  zone("leaderboard", 29 * 16, 22 * 16, 4 * 16, 2 * 16),
];
void DOORS;

let lid = 1;
const tileLayer = (name, data, extra = {}) => ({ id: lid++, name, type: "tilelayer", width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data, ...extra });
const map = {
  type: "map", version: "1.10", tiledversion: "1.11.0", orientation: "orthogonal", renderorder: "right-down",
  width: W, height: H, tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1,
  layers: [
    tileLayer("floor", floor),
    tileLayer("rugs", rugs),
    tileLayer("walls", walls),
    tileLayer("deco", deco),
    tileLayer("furniture", furniture),
    tileLayer("collision", collision, { visible: false }),
    { id: lid++, name: "objects", type: "objectgroup", draworder: "topdown", x: 0, y: 0, opacity: 1, visible: true, objects },
  ],
  nextlayerid: lid, nextobjectid: oid,
  tilesets: [
    { firstgid: RPG, name: "kenney-roguelike-rpg", image: "kenney-roguelike-rpg.png", imagewidth: 1026, imageheight: 558, columns: 57, tilecount: 57 * 31, tilewidth: 16, tileheight: 16, margin: 1, spacing: 2 },
    { firstgid: IN, name: "kenney-roguelike-indoor", image: "kenney-roguelike-indoor.png", imagewidth: 486, imageheight: 324, columns: 27, tilecount: 27 * 18, tilewidth: 16, tileheight: 16, margin: 1, spacing: 2 },
  ],
};
writeFileSync(new URL("../public/game/office.tmj", import.meta.url), JSON.stringify(map));
console.log("wrote public/game/office.tmj", `${W}x${H}`, objects.length, "objects");
