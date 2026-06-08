/**
 * Recolor decor items on baked_decor texture:
 * - plant foliage → purple, pot → black
 * - stacked books (binders + paper stacks) → purple
 *
 * Run: node scripts/patch-plant-purple.js
 */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const GLB = path.join(__dirname, '../static/models/Decor/decor.glb');
const ORIG = path.join(__dirname, '../static/models/Decor/baked_decor_orig.jpg');
const TEXTURE = path.join(__dirname, '../static/models/Decor/baked_decor_modified.jpg');
const PUBLIC_TEXTURE = path.join(__dirname, '../public/models/Decor/baked_decor_modified.jpg');

const ATLAS = 4096;
const PLANT_MESH_INDEX = 6;
const BOOK_MESH_INDICES = [0, 4, 5, 8]; // binder_1, paper_stack_1, paper_stack_2, binder_2

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

function buildMeshMask(json, bin, meshIndex) {
    const prim = json.meshes[meshIndex].primitives[0];
    const uvs = readAcc(json, bin, prim.attributes.TEXCOORD_0, 2);
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

    for (let i = 0; i < idxAcc.count; i += 3) {
        const ia = bin.readUInt16LE(istart + i * 2);
        const ib = bin.readUInt16LE(istart + i * 2 + 2);
        const ic = bin.readUInt16LE(istart + i * 2 + 4);
        triFill([uvs[ia], uvs[ib], uvs[ic]]);
    }

    return mask;
}

function buildCombinedMask(json, bin, meshIndices) {
    const mask = new Uint8Array(ATLAS * ATLAS);
    for (const meshIndex of meshIndices) {
        const part = buildMeshMask(json, bin, meshIndex);
        for (let i = 0; i < mask.length; i++) {
            if (part[i]) mask[i] = 1;
        }
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

function toPurple(r, g, b) {
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const shade = 0.22 + lum * 0.78;
    return {
        r: Math.round(58 * shade + lum * 95),
        g: Math.round(18 * shade + lum * 28),
        b: Math.round(88 * shade + lum * 125),
    };
}

function toBlack(r, g, b) {
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const v = Math.round(lum * 38);
    return { r: v, g: v, b: v };
}

async function main() {
    if (!fs.existsSync(ORIG)) {
        throw new Error('Missing baked_decor_orig.jpg');
    }

    const { json, bin } = parseGlb(GLB);
    const plantMask = buildMeshMask(json, bin, PLANT_MESH_INDEX);
    const bookMask = buildCombinedMask(json, bin, BOOK_MESH_INDICES);

    const img = await loadImage(ORIG);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);

    let foliagePainted = 0;
    let potPainted = 0;
    let booksPainted = 0;
    for (let y = 0; y < ATLAS; y++) {
        for (let x = 0; x < ATLAS; x++) {
            const idx = y * ATLAS + x;
            const i = idx * 4;
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];

            if (plantMask[idx]) {
                const next = isFoliage(r, g, b) ? toPurple(r, g, b) : toBlack(r, g, b);
                data.data[i] = next.r;
                data.data[i + 1] = next.g;
                data.data[i + 2] = next.b;
                if (isFoliage(r, g, b)) foliagePainted++;
                else potPainted++;
                continue;
            }

            if (bookMask[idx]) {
                const next = toPurple(r, g, b);
                data.data[i] = next.r;
                data.data[i + 1] = next.g;
                data.data[i + 2] = next.b;
                booksPainted++;
            }
        }
    }

    ctx.putImageData(data, 0, 0);

    const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    fs.writeFileSync(TEXTURE, buf);
    if (fs.existsSync(path.dirname(PUBLIC_TEXTURE))) {
        fs.writeFileSync(PUBLIC_TEXTURE, buf);
    }

    console.log(
        `Plant foliage → purple (${foliagePainted} px), pot → black (${potPainted} px), books → purple (${booksPainted} px)`
    );
    console.log(`Saved → ${TEXTURE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
