/**
 * Add polka dots on baked_decor texture (run after patch-plant-purple.js):
 * - coffee cup + book holder box → black dots on side walls
 * - plant foliage → green dots on leaves
 *
 * Run: node scripts/patch-coffee-polka.js
 */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const GLB = path.join(__dirname, '../static/models/Decor/decor.glb');
const TEXTURE = path.join(__dirname, '../static/models/Decor/baked_decor_modified.jpg');
const ORIG = path.join(__dirname, '../static/models/Decor/baked_decor_orig.jpg');
const PUBLIC_TEXTURE = path.join(__dirname, '../public/models/Decor/baked_decor_modified.jpg');

const ATLAS = 4096;
const POLKA_MESH_INDICES = [1, 3, 7]; // coffee, paper_holder_bottom, paper_holder_top
const PLANT_MESH_INDEX = 6;

const DOT_SPACING = 96;
const DOT_RADIUS = 22;

const BLACK_DOT = { r: 0, g: 0, b: 0 };
const GREEN_DOT = { r: 48, g: 168, b: 58 };

function parseGlb(glbPath) {
    const buf = fs.readFileSync(glbPath);
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
    const bin = buf.slice(20 + jsonLen + 8);
    return { json, bin };
}

function readAcc(json, bin, accIndex, comps) {
    const acc = json.accessors[accIndex];
    const bv = json.bufferViews[acc.bufferView];
    const start = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const out = [];
    for (let i = 0; i < acc.count; i++) {
        const o = start + i * comps * 4;
        out.push(Array.from({ length: comps }, (_, c) => bin.readFloatLE(o + c * 4)));
    }
    return out;
}

function triFillMask(mask, triUV) {
    const pts = triUV.map(([u, v]) => [u * ATLAS, v * ATLAS]);
    let minX = Math.floor(Math.min(...pts.map((p) => p[0])));
    let maxX = Math.ceil(Math.max(...pts.map((p) => p[0])));
    let minY = Math.floor(Math.min(...pts.map((p) => p[1])));
    let maxY = Math.ceil(Math.max(...pts.map((p) => p[1])));
    minX = Math.max(0, minX);
    minY = Math.max(0, minY);
    maxX = Math.min(ATLAS - 1, maxX);
    maxY = Math.min(ATLAS - 1, maxY);

    const [p0, p1, p2] = pts;
    const absArea = Math.abs(
        (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1])
    );
    if (absArea < 1e-6) return;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const w0 = ((p1[0] - p2[0]) * (y - p2[1]) - (p1[1] - p2[1]) * (x - p2[0])) / absArea;
            const w1 = ((p2[0] - p0[0]) * (y - p0[1]) - (p2[1] - p0[1]) * (x - p0[0])) / absArea;
            const w2 = 1 - w0 - w1;
            if (w0 >= 0 && w1 >= 0 && w2 >= 0) mask[y * ATLAS + x] = 1;
        }
    }
}

function buildSideWallMask(json, bin, meshIndex) {
    const prim = json.meshes[meshIndex].primitives[0];
    const pos = readAcc(json, bin, prim.attributes.POSITION, 3);
    const uv = readAcc(json, bin, prim.attributes.TEXCOORD_0, 2);
    const idxAcc = json.accessors[prim.indices];
    const ibv = json.bufferViews[idxAcc.bufferView];
    const istart = (ibv.byteOffset || 0) + (idxAcc.byteOffset || 0);
    const mask = new Uint8Array(ATLAS * ATLAS);

    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const norm = (v) => {
        const l = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
    };

    for (let i = 0; i < idxAcc.count; i += 3) {
        const ia = bin.readUInt16LE(istart + i * 2);
        const ib = bin.readUInt16LE(istart + i * 2 + 2);
        const ic = bin.readUInt16LE(istart + i * 2 + 4);
        const n = norm(cross(sub(pos[ib], pos[ia]), sub(pos[ic], pos[ia])));
        if (Math.abs(n[1]) < 0.3) {
            triFillMask(mask, [uv[ia], uv[ib], uv[ic]]);
        }
    }

    return mask;
}

function buildMeshMask(json, bin, meshIndex) {
    const prim = json.meshes[meshIndex].primitives[0];
    const uv = readAcc(json, bin, prim.attributes.TEXCOORD_0, 2);
    const idxAcc = json.accessors[prim.indices];
    const ibv = json.bufferViews[idxAcc.bufferView];
    const istart = (ibv.byteOffset || 0) + (idxAcc.byteOffset || 0);
    const mask = new Uint8Array(ATLAS * ATLAS);

    for (let i = 0; i < idxAcc.count; i += 3) {
        const ia = bin.readUInt16LE(istart + i * 2);
        const ib = bin.readUInt16LE(istart + i * 2 + 2);
        const ic = bin.readUInt16LE(istart + i * 2 + 4);
        triFillMask(mask, [uv[ia], uv[ib], uv[ic]]);
    }

    return mask;
}

function isFoliage(r, g, b) {
    if (g < 38) return false;
    const greenLead = g - Math.max(r, b);
    if (greenLead < 10) return false;
    if (g < r * 0.95 && g < b * 0.95) return false;
    return true;
}

function buildPlantFoliageMask(json, bin, origData) {
    const plantMask = buildMeshMask(json, bin, PLANT_MESH_INDEX);
    const foliageMask = new Uint8Array(ATLAS * ATLAS);

    for (let y = 0; y < ATLAS; y++) {
        for (let x = 0; x < ATLAS; x++) {
            const idx = y * ATLAS + x;
            if (!plantMask[idx]) continue;
            const i = idx * 4;
            if (isFoliage(origData[i], origData[i + 1], origData[i + 2])) {
                foliageMask[idx] = 1;
            }
        }
    }

    return foliageMask;
}

function paintPolkaDots(data, targetMask, color) {
    let minX = ATLAS;
    let maxX = 0;
    let minY = ATLAS;
    let maxY = 0;

    for (let y = 0; y < ATLAS; y++) {
        for (let x = 0; x < ATLAS; x++) {
            if (!targetMask[y * ATLAS + x]) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    if (minX > maxX || minY > maxY) return 0;

    const inset = DOT_RADIUS + 10;
    minX += inset;
    maxX -= inset;
    minY += inset;
    maxY -= inset;

    const radiusSq = DOT_RADIUS * DOT_RADIUS;
    let dotted = 0;

    for (let cy = minY + DOT_SPACING / 2; cy <= maxY; cy += DOT_SPACING) {
        const row = Math.round((cy - minY) / DOT_SPACING);
        const xOffset = (row % 2) * (DOT_SPACING / 2);

        for (let cx = minX + DOT_SPACING / 2 + xOffset; cx <= maxX; cx += DOT_SPACING) {
            for (let dy = -DOT_RADIUS; dy <= DOT_RADIUS; dy++) {
                for (let dx = -DOT_RADIUS; dx <= DOT_RADIUS; dx++) {
                    if (dx * dx + dy * dy > radiusSq) continue;
                    const x = Math.round(cx + dx);
                    const y = Math.round(cy + dy);
                    if (x < 0 || x >= ATLAS || y < 0 || y >= ATLAS) continue;
                    const idx = y * ATLAS + x;
                    if (!targetMask[idx]) continue;
                    const i = idx * 4;
                    data[i] = color.r;
                    data[i + 1] = color.g;
                    data[i + 2] = color.b;
                    dotted++;
                }
            }
        }
    }

    return dotted;
}

async function main() {
    if (!fs.existsSync(ORIG)) {
        throw new Error('Missing baked_decor_orig.jpg');
    }
    const source = fs.existsSync(TEXTURE) ? TEXTURE : ORIG;

    const { json, bin } = parseGlb(GLB);

    const origImg = await loadImage(ORIG);
    const origCanvas = createCanvas(origImg.width, origImg.height);
    const origCtx = origCanvas.getContext('2d');
    origCtx.drawImage(origImg, 0, 0);
    const origData = origCtx.getImageData(0, 0, ATLAS, ATLAS).data;

    const img = await loadImage(source);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    let blackDots = 0;
    for (const meshIndex of POLKA_MESH_INDICES) {
        const sideMask = buildSideWallMask(json, bin, meshIndex);
        blackDots += paintPolkaDots(imageData.data, sideMask, BLACK_DOT);
    }

    const foliageMask = buildPlantFoliageMask(json, bin, origData);
    const greenDots = paintPolkaDots(imageData.data, foliageMask, GREEN_DOT);

    ctx.putImageData(imageData, 0, 0);

    const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    fs.writeFileSync(TEXTURE, buf);
    if (fs.existsSync(path.dirname(PUBLIC_TEXTURE))) {
        fs.writeFileSync(PUBLIC_TEXTURE, buf);
    }

    console.log(`Black polka dots — cup + book holder (${blackDots} px)`);
    console.log(`Green polka dots — plant foliage (${greenDots} px)`);
    console.log(`Saved → ${TEXTURE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
