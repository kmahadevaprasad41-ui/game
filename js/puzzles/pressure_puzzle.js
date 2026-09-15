/**
 * Sequential Pressure Gauge Timing Puzzle
 * Directly implements Panel 2 of the Steampunk Escape Blueprint:
 * Monitor & stabilize all gauges sequentially (A -> B -> C -> D) within critical safe window.
 * Missing window blows the valve and generates an acoustic threat alerting the Octopus!
 */
class PressurePuzzle {
    constructor() {
        this.isOpen = false;
        this.player = null;
        this.activeGaugeIndex = 0; // 0: A, 1: B, 2: C, 3: D
        this.animationId = null;

        this.gauges = [
            { id: 'A', name: 'BOILER INTAKE', pressure: 20, speed: 0.8, dir: 1, stabilized: false, canvasId: 'gauge-canvas-a' },
            { id: 'B', name: 'MAIN MANIFOLD', pressure: 10, speed: 1.2, dir: 1, stabilized: false, canvasId: 'gauge-canvas-b' },
            { id: 'C', name: 'COOLANT CIRCUIT', pressure: 50, speed: 1.5, dir: -1, stabilized: false, canvasId: 'gauge-canvas-c' },
            { id: 'D', name: 'PRIMARY EXHAUST', pressure: 30, speed: 1.8, dir: 1, stabilized: false, canvasId: 'gauge-canvas-d' }
        ];

        // Zones: Safe [40, 65], Caution [65, 80], Danger [80, 100]
        this.safeMin = 40;
        this.safeMax = 65;
        this.dangerMin = 80;
    }

    init() {
        // Canvases are initialized when modal opens
    }

    open(player, octopus, particles) {
        this.isOpen = true;
        this.player = player;
        this.octopus = octopus;
        this.particles = particles;

        const modal = document.getElementById('pressure-puzzle-modal');
        if (modal) modal.style.display = 'flex';

        this.updateButtons();
        this.loop();
    }

    close() {
        this.isOpen = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        const modal = document.getElementById('pressure-puzzle-modal');
        if (modal) modal.style.display = 'none';
    }

    updateButtons() {
        const btn = document.getElementById('btn-stabilize-gauge');
        if (!btn) return;
        if (this.activeGaugeIndex < this.gauges.length) {
            const cur = this.gauges[this.activeGaugeIndex];
            btn.innerText = `TURN VALVE [GAUGE ${cur.id}]`;
            btn.disabled = false;
        } else {
            btn.innerText = `ALL VALVES BALANCED!`;
            btn.disabled = true;
        }
    }

    attemptStabilize() {
        if (this.activeGaugeIndex >= this.gauges.length) return;

        const g = this.gauges[this.activeGaugeIndex];
        sounds.playValveTurn();

        if (g.pressure >= this.safeMin && g.pressure <= this.safeMax) {
            // SUCCESSFUL TIMING!
            g.stabilized = true;
            sounds.playGaugeSuccess();
            sounds.playSteamHiss(0.4, 0.2);

            const badge = document.getElementById(`badge-gauge-${g.id.toLowerCase()}`);
            if (badge) {
                badge.innerText = 'STABILIZED';
                badge.className = 'gauge-status-badge safe';
            }

            this.activeGaugeIndex++;

            if (this.activeGaugeIndex >= this.gauges.length) {
                // ALL GAUGES STABILIZED!
                this.player.pressureStabilized = true;
                sounds.playGaugeSuccess();
                setTimeout(() => {
                    alert('STATION HYDRAULICS SECURED! All 4 steam pressure conduits stabilized. Main Blast Door is now pressurized!');
                    this.close();
                }, 350);
            } else {
                this.updateButtons();
            }
        } else {
            // FAILED TIMING -> STEAM RUPTURE & OCTOPUS ALERT!
            sounds.playSteamHiss(1.4, 0.6);
            sounds.playAlarmKlaxon();

            // Emit massive acoustic sound ripple at player position
            if (this.player && this.particles) {
                this.particles.addSoundRipple(this.player.x, this.player.y, 1.0, true);
                this.particles.addSteam(this.player.x, this.player.y, 0, -2, 20, 50, 'rgba(240, 240, 255, 0.8)');
            }

            // Immediately send octopus into HUNT / INVESTIGATE mode!
            if (this.octopus) {
                this.octopus.state = 'HUNT';
                this.octopus.targetX = this.player.x;
                this.octopus.targetY = this.player.y;
            }

            alert('WARNING! VALVE RUPTURE! High acoustic steam jet released! Dreadnought Steam Octopus has detected the noise!');
            this.close();
        }
    }

    loop() {
        if (!this.isOpen) return;

        // Update oscillating needle values
        this.gauges.forEach((g, idx) => {
            if (!g.stabilized) {
                g.pressure += g.speed * g.dir;
                if (g.pressure >= 95) {
                    g.pressure = 95;
                    g.dir = -1;
                } else if (g.pressure <= 5) {
                    g.pressure = 5;
                    g.dir = 1;
                }
            }
            this.drawGauge(g);
        });

        this.animationId = requestAnimationFrame(() => this.loop());
    }

    drawGauge(g) {
        const canvas = document.getElementById(g.canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = w / 2 - 10;

        ctx.clearRect(0, 0, w, h);

        // Dial face
        ctx.fillStyle = '#1b1712';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Arcs for zones: Safe (Green), Caution (Yellow), Danger (Red)
        // Angles: 0.75 PI to 2.25 PI (270 deg sweep)
        const startA = Math.PI * 0.75;
        const totalSweep = Math.PI * 1.5;

        // Draw Safe Zone (40% to 65%)
        ctx.beginPath();
        ctx.arc(cx, cy, r - 12, startA + totalSweep * 0.4, startA + totalSweep * 0.65);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw Caution Zone (65% to 80%)
        ctx.beginPath();
        ctx.arc(cx, cy, r - 12, startA + totalSweep * 0.65, startA + totalSweep * 0.80);
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw Danger Zone (80% to 100%)
        ctx.beginPath();
        ctx.arc(cx, cy, r - 12, startA + totalSweep * 0.80, startA + totalSweep * 1.0);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Tick marks
        for (let i = 0; i <= 20; i++) {
            const a = startA + (i / 20) * totalSweep;
            const inner = (i % 5 === 0) ? r - 24 : r - 18;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
            ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = (i % 5 === 0) ? 2 : 1;
            ctx.stroke();
        }

        // Needle
        const needleAngle = startA + (g.pressure / 100) * totalSweep;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        ctx.strokeStyle = g.stabilized ? '#2ecc71' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(r - 18, 0);
        ctx.stroke();

        // Needle center brass hub
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();
        ctx.strokeStyle = '#4a3212';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Gauge Label
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 12px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GAUGE [${g.id}]`, cx, cy + 24);
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.fillStyle = '#8f7d6a';
        ctx.fillText(`${Math.round(g.pressure)} PSI`, cx, cy + 36);
    }
}

const pressurePuzzle = new PressurePuzzle();
