/**
 * Realistic Steampunk Sprite Engine
 * Extracts and processes high-resolution realistic assets from the user's asset sheets.
 * Implements smooth alpha-masking background removal for crystal-clear realistic sprites.
 */
class SpriteEngine {
    constructor() {
        this.loaded = false;
        this.sprites = {};
        this.patterns = {};

        this.rawRealisticImg = new Image();
        this.rawSteampunkImg = new Image();

        this.defs = {
            // From realistic_assets.jpg (1024 x 559)
            player_front: { src: 'realistic', x: 26, y: 178, w: 152, h: 218 },
            player_back:  { src: 'realistic', x: 190, y: 178, w: 142, h: 218 },
            player_side:  { src: 'realistic', x: 344, y: 178, w: 96, h: 218 },
            octopus_left: { src: 'realistic', x: 438, y: 115, w: 240, h: 215 },
            octopus_right:{ src: 'realistic', x: 682, y: 115, w: 275, h: 215 },
            wall:         { src: 'realistic', x: 28, y: 395, w: 176, h: 125 },
            catwalk:      { src: 'realistic', x: 202, y: 416, w: 132, h: 88 },
            floor_grate:  { src: 'realistic', x: 42, y: 470, w: 158, h: 82 },
            piping:       { src: 'realistic', x: 345, y: 370, w: 130, h: 140 },
            hazard_vent:  { src: 'realistic', x: 586, y: 455, w: 54, h: 65 },
            chest:        { src: 'realistic', x: 642, y: 462, w: 74, h: 58 },
            lantern:      { src: 'realistic', x: 500, y: 450, w: 36, h: 68 },
            gauge_stand:  { src: 'realistic', x: 542, y: 450, w: 40, h: 68 },
            valve_lever:  { src: 'realistic', x: 560, y: 395, w: 38, h: 50 },

            // From steampunk_assets.jpg (1024 x 765)
            crab:         { src: 'steampunk', x: 506, y: 175, w: 100, h: 75 },
            wasp:         { src: 'steampunk', x: 546, y: 298, w: 75, h: 72 },
            gear_large:   { src: 'steampunk', x: 516, y: 500, w: 60, h: 60 }
        };
    }

    loadAll(onReady) {
        let loadedCount = 0;
        const checkReady = () => {
            loadedCount++;
            if (loadedCount >= 2) {
                this.processAllSprites();
                this.loaded = true;
                if (onReady) onReady();
            }
        };

        this.rawRealisticImg.onload = checkReady;
        this.rawSteampunkImg.onload = checkReady;

        this.rawRealisticImg.src = 'assets/realistic_assets.jpg';
        this.rawSteampunkImg.src = 'assets/steampunk_assets.jpg';
    }

    processAllSprites() {
        for (const [key, def] of Object.entries(this.defs)) {
            const srcImg = def.src === 'realistic' ? this.rawRealisticImg : this.rawSteampunkImg;
            this.sprites[key] = this.cropAndRemoveBg(srcImg, def.x, def.y, def.w, def.h, key);
        }
    }

    cropAndRemoveBg(srcImg, sx, sy, sw, sh, key) {
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');

        // Draw cropped section
        ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, sw, sh);

        // For environment tiles and UI, preserve rich background textures; for entities, remove dark border
        const isEntity = ['player_front', 'player_back', 'player_side', 'octopus_left', 'octopus_right', 'crab', 'wasp', 'chest', 'hazard_vent', 'lantern', 'gauge_stand'].includes(key);

        if (isEntity) {
            try {
                const imgData = ctx.getImageData(0, 0, sw, sh);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const brightness = Math.max(r, g, b);

                    // Threshold near-black background grid with soft alpha feathering
                    if (brightness < 20) {
                        data[i + 3] = 0;
                    } else if (brightness < 42) {
                        // Smooth alpha blend edge
                        data[i + 3] = Math.floor(((brightness - 20) / 22) * 255);
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            } catch (e) {
                // In case of local CORS restriction, fallback to direct canvas drawing
            }
        }

        return canvas;
    }

    get(name) {
        return this.sprites[name] || null;
    }

    draw(ctx, name, dx, dy, dw, dh, flipX = false, alpha = 1.0) {
        const sprite = this.get(name);
        if (!sprite) return false;

        ctx.save();
        if (alpha < 1.0) ctx.globalAlpha = alpha;

        if (flipX) {
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0, dw, dh);
        } else {
            ctx.drawImage(sprite, dx, dy, dw, dh);
        }
        ctx.restore();
        return true;
    }
}

const sprites = new SpriteEngine();
