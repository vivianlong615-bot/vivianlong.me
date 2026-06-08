/**
 * Restore computer texture and replace the front bottom-left monitor bezel logo.
 *
 * Front face UV (from computer_setup.glb): u≈900–1775, v≈2570–2750
 * Globe sits on the atlas RIGHT edge → appears on the left of the bezel.
 *
 * Run: node scripts/patch-monitor-logo.js
 */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const ORIG = path.join(__dirname, '../static/models/Computer/baked_computer_orig.jpg');
const TEXTURE = path.join(__dirname, '../static/models/Computer/baked_computer.jpg');
const PUBLIC_TEXTURE = path.join(__dirname, '../public/models/Computer/baked_computer.jpg');

// Right edge must stay ~u1770 for globe; trim excess from the left (atlas low-x) side
const MONITOR_LOGO = { x: 1200, y: 2570, w: 570, h: 178 };
const TEXT_COLOR = 'rgb(72, 72, 72)';
const LOGO_TEXT = 'Vivian Long_Portfolio';

function avgBg(ctx, x, y, w, h) {
    const data = ctx.getImageData(x, y, w, h).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (lum > 145 && lum < 215) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
        }
    }
    if (!n) return { r: 168, g: 168, b: 168 };
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function drawMonitorLogo(ctx, region) {
    const bg = avgBg(ctx, region.x + 200, region.y + 55, 240, 45);
    const fill = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;

    // Bleed only on top/bottom/right (globe side); keep left edge crisp
    ctx.fillStyle = fill;
    ctx.fillRect(region.x, region.y - 3, region.w + 6, region.h + 6);
    ctx.fillRect(region.x, region.y, region.w, region.h);

    const pad = 14;
    const maxTextW = region.w - pad * 2;
    let fontSize = 28;
    let font = `bold ${fontSize}px "Times New Roman", Georgia, serif`;
    ctx.font = font;
    let textW = ctx.measureText(LOGO_TEXT).width;

    while (textW > maxTextW && fontSize > 18) {
        fontSize -= 1;
        font = `bold ${fontSize}px "Times New Roman", Georgia, serif`;
        ctx.font = font;
        textW = ctx.measureText(LOGO_TEXT).width;
    }

    const textCx = region.x + region.w / 2;
    const textCy = region.y + region.h * 0.5;

    ctx.save();
    ctx.translate(textCx, textCy);
    ctx.rotate(Math.PI);
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(LOGO_TEXT, 0, 0);
    ctx.restore();

    return fontSize;
}

async function main() {
    if (!fs.existsSync(ORIG)) {
        throw new Error('Missing baked_computer_orig.jpg — download from henryheffernan.com first.');
    }

    const img = await loadImage(ORIG);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    const fontSize = drawMonitorLogo(ctx, MONITOR_LOGO);

    const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    fs.writeFileSync(TEXTURE, buf);
    if (fs.existsSync(path.dirname(PUBLIC_TEXTURE))) {
        fs.writeFileSync(PUBLIC_TEXTURE, buf);
    }

    const stamp = Date.now();
    fs.writeFileSync(
        path.join(__dirname, '../static/models/Computer/.texture-version'),
        String(stamp)
    );

    console.log('Patched front bottom-left monitor logo → Vivian Long_Portfolio');
    console.log(`Region: x=${MONITOR_LOGO.x} y=${MONITOR_LOGO.y} w=${MONITOR_LOGO.w} h=${MONITOR_LOGO.h} font=${fontSize}px`);
    console.log(`Texture version stamp: ${stamp}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
