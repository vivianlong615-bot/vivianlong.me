/**
 * Recolor desk legs, drawers, and sides → blue on baked_environment.jpg.
 * Skips horizontal tabletop (already blue from patch-desk-blue.js).
 * Prefer running patch-desk-blue.js alone — it now tints the full desk.
 *
 * Run: node scripts/patch-desk-body-black.js
 */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const GLB = path.join(__dirname, '../static/models/World/environment.glb');
const TEXTURE = path.join(__dirname, '../static/models/World/baked_environment.jpg');
const ORIG = path.join(__dirname, '../static/models/World/baked_environment_orig.jpg');
const PUBLIC_TEXTURE = path.join(__dirname, '../public/models/World/baked_environment.jpg');

const ATLAS = 4096;
const DESK_MESH_INDEX = 1;

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

function buildDeskBodyMask(json, bin) {
    const prim = json.meshes[DESK_MESH_INDEX].primitives[0];
    const pos = readAcc(json, bin, prim.attributes.POSITION, 3);
    const uv = readAcc(json, bin, prim.attributes.TEXCOORD_0, 2);
    const idxAcc = json.accessors[prim.indices];
    const ibv = json.bufferViews[idxAcc.bufferView];
    const istart = (ibv.byteOffset || 0) + (idxAcc.byteOffset || 0);

    const mask = new Uint8Array(ATLAS * ATLAS);

    function triFill(triUV) {
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
        if (Math.abs(n[1]) <= 0.85) {
            triFill([uv[ia], uv[ib], uv[ic]]);
        }
    }

    return mask;
}

function tintBlue(r, g, b) {
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const shade = 0.42 + lum * 0.58;
    return {
        r: Math.round(18 * shade),
        g: Math.round(72 * shade + lum * 30),
        b: Math.round(128 + lum * 127),
    };
}

async function main() {
    const source = fs.existsSync(TEXTURE) ? TEXTURE : ORIG;
    if (!fs.existsSync(source)) {
        throw new Error('Missing baked_environment.jpg');
    }

    const { json, bin } = parseGlb(GLB);
    const mask = buildDeskBodyMask(json, bin);

    const img = await loadImage(source);
    const origImg = await loadImage(ORIG);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);

    const origCanvas = createCanvas(origImg.width, origImg.height);
    const origCtx = origCanvas.getContext('2d');
    origCtx.drawImage(origImg, 0, 0);
    const origData = origCtx.getImageData(0, 0, img.width, img.height).data;

    let painted = 0;
    for (let y = 0; y < ATLAS; y++) {
        for (let x = 0; x < ATLAS; x++) {
            if (!mask[y * ATLAS + x]) continue;
            const i = (y * ATLAS + x) * 4;
            const next = tintBlue(origData[i], origData[i + 1], origData[i + 2]);
            data.data[i] = next.r;
            data.data[i + 1] = next.g;
            data.data[i + 2] = next.b;
            painted++;
        }
    }

    ctx.putImageData(data, 0, 0);

    const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    fs.writeFileSync(TEXTURE, buf);
    if (fs.existsSync(path.dirname(PUBLIC_TEXTURE))) {
        fs.writeFileSync(PUBLIC_TEXTURE, buf);
    }

    console.log(`Desk body (legs/drawers/sides) recolored → blue (${painted} px, desktop unchanged)`);
    console.log(`Saved → ${TEXTURE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
