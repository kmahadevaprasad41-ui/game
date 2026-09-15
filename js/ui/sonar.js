/**
 * Unified Steampunk Sonar & Threat Radar System
 * Tracks and visualizes everything on ONE integrated radar display:
 * 🟢 Human Diver (Player) with heading arrow
 * 🔴 Dreadnought Steam Octopus Boss with threat tracking & distance
 * 🟡 Key Components & Storage Chests
 * 🔵 Main Airlock Escape Hatch & Pressure Manifold
 * ⚪ Oxygen Refill Stations & Acoustic Sound Ripples
 */
class SonarRadar {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.sweepAngle = 0;
        this.sweepSpeed = 0.045;
        this.pingTimer = 0;
        this.radarRadius = 90;
        this.maxWorldRange = 850; // Detection radius in world units
    }

    init() {
        this.canvas = document.getElementById('sonar-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    update(player, octopus, chests, pressureTerminal, escapeHatch, oxygenStations, particles) {
        this.sweepAngle = (this.sweepAngle + this.sweepSpeed) % (Math.PI * 2);
        this.pingTimer++;

        if (this.pingTimer >= 140) {
            this.pingTimer = 0;
            sounds.playSonarPing();
        }
    }

    draw(player, octopus, chests, pressureTerminal, escapeHatch, oxygenStations, particles) {
        if (!this.ctx || !this.canvas || !player) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = this.radarRadius;

        ctx.clearRect(0, 0, w, h);

        // 1. CRT Phosphor Radar Background
        const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
        bgGrad.addColorStop(0, '#041810');
        bgGrad.addColorStop(0.75, '#020d08');
        bgGrad.addColorStop(1, '#000503');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // 2. Concentric Range Rings (100m, 200m, 300m)
        ctx.strokeStyle = 'rgba(16, 77, 53, 0.7)';
        ctx.lineWidth = 1;
        [0.33, 0.66, 1.0].forEach(scale => {
            ctx.beginPath();
            ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Crosshairs
        ctx.strokeStyle = 'rgba(16, 77, 53, 0.5)';
        ctx.beginPath();
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        ctx.stroke();

        // 3. Rotating Radar Sweep Beam with phosphor fade
        const sweepGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        sweepGrad.addColorStop(0, 'rgba(63, 224, 208, 0.45)');
        sweepGrad.addColorStop(1, 'rgba(46, 204, 113, 0.12)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, this.sweepAngle - 0.4, this.sweepAngle);
        ctx.closePath();
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Bright leading sweep line
        ctx.strokeStyle = '#55efa0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(this.sweepAngle) * r, cy + Math.sin(this.sweepAngle) * r);
        ctx.stroke();
        ctx.restore();

        // Coordinate converter (world to radar screen)
        const toRadar = (wx, wy) => {
            const dx = wx - player.x;
            const dy = wy - player.y;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(dist, this.maxWorldRange);
            const radarDist = (clampedDist / this.maxWorldRange) * (r - 8);
            const angle = Math.atan2(dy, dx);
            return {
                x: cx + Math.cos(angle) * radarDist,
                y: cy + Math.sin(angle) * radarDist,
                dist: Math.round(dist / 10),
                inRange: dist <= this.maxWorldRange
            };
        };

        // 4. 🟡 ALL 4 KEY COMPONENTS / CHESTS TRACKING
        if (chests) {
            chests.forEach((ch, idx) => {
                if (!ch.opened) {
                    const pos = toRadar(ch.x, ch.y);
                    ctx.save();
                    // Golden beacon glow
                    ctx.fillStyle = '#f1c40f';
                    ctx.shadowColor = '#f1c40f';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Gear ring icon
                    ctx.strokeStyle = '#f39c12';
                    ctx.lineWidth = 1.2;
                    ctx.strokeRect(pos.x - 4, pos.y - 4, 8, 8);

                    // Explicit Label: KEY 1, KEY 2, KEY 3, KEY 4 [Xm]
                    const label = `${ch.keyTag || 'KEY ' + (idx + 1)} [${pos.dist}m]`;
                    ctx.font = 'bold 8px monospace';
                    ctx.fillStyle = '#f7e28b';
                    ctx.fillText(label, pos.x - 18, pos.y - 6);
                    ctx.restore();
                }
            });
        }

        // 5. ⚪ OXYGEN RECHARGE STATIONS
        if (oxygenStations) {
            for (const st of oxygenStations) {
                const pos = toRadar(st.x, st.y);
                ctx.save();
                ctx.fillStyle = '#3fe0d0';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '7px monospace';
                ctx.fillText('O2', pos.x - 4, pos.y - 5);
                ctx.restore();
            }
        }

        // 6. 🔵 PRESSURE MANIFOLD & MAIN ESCAPE AIRLOCK HATCH
        if (pressureTerminal) {
            const pos = toRadar(pressureTerminal.x, pressureTerminal.y);
            ctx.save();
            ctx.fillStyle = player.pressureStabilized ? '#2ecc71' : '#3498db';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '7px monospace';
            ctx.fillText('PRESS', pos.x - 10, pos.y - 5);
            ctx.restore();
        }

        if (escapeHatch) {
            const pos = toRadar(escapeHatch.x, escapeHatch.y);
            ctx.save();
            ctx.fillStyle = (player.keyAssembled && player.pressureStabilized) ? '#2ecc71' : '#e67e22';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.font = 'bold 8px monospace';
            ctx.fillText('HATCH', pos.x - 12, pos.y - 7);
            ctx.restore();
        }

        // 7. 🔴 DREADNOUGHT STEAM OCTOPUS BOSS TRACKING
        if (octopus) {
            const pos = toRadar(octopus.x, octopus.y);
            const isHunting = octopus.state === 'HUNT';
            const col = isHunting ? '#ff1e1e' : (octopus.state === 'INVESTIGATE' ? '#ff9900' : '#e74c3c');

            ctx.save();
            // Threat radar blip
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = isHunting ? 12 : 6;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 5.5, 0, Math.PI * 2);
            ctx.fill();

            // Threat pulsating alert ring
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.5;
            const pulse = (Date.now() / 200) % 8;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Threat label and distance in meters
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = col;
            ctx.fillText(`OCTOPUS [${pos.dist}m]`, pos.x - 24, pos.y - 9);
            ctx.restore();
        }

        // 8. 🟢 HUMAN DIVER (PLAYER) AT RADAR CENTER
        ctx.save();
        // Green illuminated diver marker
        ctx.fillStyle = '#2ecc71';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Directional Heading Indicator Arrow
        const arrowDist = 12;
        const arrowX = cx + Math.cos(player.angle) * arrowDist;
        const arrowY = cy + Math.sin(player.angle) * arrowDist;
        ctx.strokeStyle = '#55efa0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#55efa0';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', cx, cy + 14);
        ctx.restore();
    }
}

const sonar = new SonarRadar();
