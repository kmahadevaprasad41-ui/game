/**
 * Gear Crank Key Assembly Minigame
 * Directly implements Panel 1 of the Steampunk Escape Blueprint:
 * Multi-part mechanical key assembly with gear combination and piston extension.
 */
class KeyPuzzle {
    constructor() {
        this.isOpen = false;
        this.slots = [null, null, null]; // 3 gear positions
        this.pistonLength = 20; // 0 to 100
        this.targetLength = 75;
        this.targetGears = ['small', 'large', 'small'];
        this.selectedGearType = null;
        this.canvas = null;
        this.ctx = null;
    }

    init() {
        this.canvas = document.getElementById('key-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        // Slider listener
        const slider = document.getElementById('piston-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.pistonLength = parseInt(e.target.value, 10);
                sounds.playGearClick();
                this.draw();
            });
        }
    }

    open(player) {
        this.isOpen = true;
        this.player = player;
        const modal = document.getElementById('key-puzzle-modal');
        if (modal) modal.style.display = 'flex';
        this.updatePartsTray(player);
        this.draw();
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('key-puzzle-modal');
        if (modal) modal.style.display = 'none';
    }

    updatePartsTray(player) {
        const hasSmall = player.hasItem('gear_small');
        const hasLarge = player.hasItem('gear_large');
        const hasPiston = player.hasItem('piston_extender');
        const hasHandle = player.hasItem('gear_handle');

        const count = (hasSmall ? 1 : 0) + (hasLarge ? 1 : 0) + (hasPiston ? 1 : 0) + (hasHandle ? 1 : 0);

        const smallBtn = document.getElementById('pick-gear-small');
        const largeBtn = document.getElementById('pick-gear-large');
        const pistonBadge = document.getElementById('piston-status');

        if (smallBtn) smallBtn.style.opacity = hasSmall ? '1' : '0.4';
        if (largeBtn) largeBtn.style.opacity = hasLarge ? '1' : '0.4';
        if (pistonBadge) {
            pistonBadge.innerText = `${count}/4 KEYS FOUND`;
            pistonBadge.style.color = count === 4 ? '#2ecc71' : '#e67e22';
        }

        const slider = document.getElementById('piston-slider');
        if (slider) {
            slider.disabled = !hasPiston;
            if (hasPiston && count === 4) {
                slider.value = 75;
                this.pistonLength = 75;
            }
        }

        // If player has all 4 keys, auto-mount them for immediate assembly
        if (count === 4) {
            this.slots = ['small', 'large', 'small'];
        }
    }

    selectGear(type) {
        if (type === 'small' && !this.player.hasItem('gear_small')) return;
        if (type === 'large' && !this.player.hasItem('gear_large')) return;
        this.selectedGearType = type;
        sounds.playGearClick();

        document.querySelectorAll('.gear-pick-item').forEach(el => el.classList.remove('selected'));
        const el = document.getElementById(`pick-gear-${type}`);
        if (el) el.classList.add('selected');
    }

    placeGearInSlot(slotIndex) {
        if (!this.selectedGearType) return;
        this.slots[slotIndex] = this.selectedGearType;
        sounds.playGearClick();
        this.draw();
    }

    checkAssembly() {
        const hasSmall = this.player.hasItem('gear_small');
        const hasLarge = this.player.hasItem('gear_large');
        const hasPiston = this.player.hasItem('piston_extender');
        const hasHandle = this.player.hasItem('gear_handle');

        const count = (hasSmall ? 1 : 0) + (hasLarge ? 1 : 0) + (hasPiston ? 1 : 0) + (hasHandle ? 1 : 0);

        if (count < 4) {
            sounds.playDamage();
            alert(`LOCK JAMMED: You need all 4 Keys to calibrate and unlock the Hatch!\nFound: ${count}/4 Keys.\nLook at your UNIFIED RADAR in the bottom-right corner to locate: KEY 1, KEY 2, KEY 3, and KEY 4!`);
            return false;
        }

        // All 4 keys collected! Calibrate and unlock!
        this.slots = ['small', 'large', 'small'];
        this.pistonLength = 75;
        this.draw();

        sounds.playGaugeSuccess();
        this.player.keyAssembled = true;
        this.player.addItem('crank_key');
        alert('★ ALL 4 KEYS ASSEMBLED & CALIBRATED! ★\n\nMain Hatch protective lock cylinder has successfully disengaged!\nNow ensure the 4-pipe pressure gauges at Boiler Junction are balanced to complete final escape!');
        this.close();
        return true;
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Blueprint grid background
        ctx.fillStyle = '#0c0f14';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#15222e';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        const centerY = h / 2;

        // 1. Brass Key Spindle Shaft
        ctx.fillStyle = '#b86234';
        ctx.fillRect(40, centerY - 8, 260, 16);
        ctx.strokeStyle = '#8a4120';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, centerY - 8, 260, 16);

        // Key bow / handle
        ctx.beginPath();
        ctx.arc(40, centerY, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();
        ctx.strokeStyle = '#5a3d1b';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(40, centerY, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0c0f14';
        ctx.fill();
        ctx.stroke();

        // 2. Telescoping Piston Shaft Extender (Adjusted by slider)
        const pistonExtension = (this.pistonLength / 100) * 110;
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(300, centerY - 6, 60 + pistonExtension, 12);
        ctx.strokeStyle = '#5a3d1b';
        ctx.strokeRect(300, centerY - 6, 60 + pistonExtension, 12);

        // Key Bitting Teeth on piston tip
        const tipX = 360 + pistonExtension;
        ctx.fillStyle = '#f7e28b';
        ctx.fillRect(tipX - 12, centerY - 16, 8, 10);
        ctx.fillRect(tipX - 26, centerY - 14, 8, 8);
        ctx.fillRect(tipX - 40, centerY - 18, 8, 12);

        // Access Depth Target Indicator
        const targetX = 360 + (this.targetLength / 100) * 110;
        ctx.strokeStyle = '#2ecc71';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(targetX, centerY - 35);
        ctx.lineTo(targetX, centerY + 35);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#2ecc71';
        ctx.font = '10px monospace';
        ctx.fillText('ACCESS DEPTH', targetX - 35, centerY - 40);

        // 3. Three Gear Spindles on Handle
        const slotPositions = [
            { x: 40, y: centerY - 45 },
            { x: 95, y: centerY },
            { x: 40, y: centerY + 45 }
        ];

        slotPositions.forEach((pos, idx) => {
            const gear = this.slots[idx];

            if (gear) {
                // Draw installed gear
                this.drawGear(ctx, pos.x, pos.y, gear === 'large' ? 32 : 20, '#d4af37');
            } else {
                // Empty gear spindle peg
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
                ctx.strokeStyle = '#e67e22';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#e67e22';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`PIN ${idx + 1}`, pos.x - 16, pos.y + 4);
            }
        });
    }

    drawGear(ctx, x, y, radius, color) {
        ctx.save();
        ctx.translate(x, y);

        const teeth = radius > 25 ? 12 : 8;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#4a3212';
        ctx.lineWidth = 2;

        for (let i = 0; i < teeth; i++) {
            const a = (i / teeth) * Math.PI * 2;
            ctx.beginPath();
            ctx.rect(Math.cos(a) * (radius - 2) - 3, Math.sin(a) * (radius - 2) - 3, 6, 6);
            ctx.fill();
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1c150c';
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

const keyPuzzle = new KeyPuzzle();
