// The World in One Day — 20 November 2026 (Node 22, standard library only).
//
// This program writes the entry image to /output/entry.png. The image is a
// newspaper-style front page drawn for Friday 20 November 2026: the world
// court's genocide ruling on Myanmar, the Trump–Xi–Putin summit in Shenzhen,
// the overnight strikes on Kyiv, the Anthropic debut and the stock slide,
// the Houthi missiles over Riyadh, and the Senate's permitting bill — plus
// an "also today" strip. It was drawn offline from the day's reported news
// (sources are named on the image itself) and ships as entry.png beside
// this file, so the program is a plain deterministic copy: no network, no
// clock, no randomness, and two runs write the same bytes.
//
// The copy is checked before it is written: the source must be a whole PNG
// (magic bytes, IHDR dimensions at most 1024 by 1024, total size at most
// 1 MiB), and the destination directory is created when it is missing.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;

// The PNG signature, then the IHDR chunk: length 13, type "IHDR", width and
// height as big-endian uint32 at offsets 16 and 20.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const source = fileURLToPath(new URL("./entry.png", import.meta.url));
const bytes = readFileSync(source);

if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB cap`);
}
if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error("entry.png is not a PNG file");
}
if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
  throw new Error("entry.png has no IHDR chunk where a PNG must");
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE || width === 0 || height === 0) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 cap`);
}
// A whole PNG ends with an IEND chunk; a truncated file must not pass.
if (!bytes.subarray(bytes.length - 12).toString("ascii").includes("IEND")) {
  throw new Error("entry.png has no IEND chunk: the file is truncated");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}
copyFileSync(source, join(outDir, "entry.png"));
process.stdout.write(
  `news-image: wrote entry.png (${width}x${height}, ${bytes.length} bytes)\n`,
);
