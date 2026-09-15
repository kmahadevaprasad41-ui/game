/**
 * Realistic Particle System for Steampunk Atmosphere
 * Handles realistic billowing steam plumes, high-pressure water spray leaks,
 * water puddle splash ripples, soft acoustic sonar ripples,
 * water bubbles, and molten brass sparks.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.soundRipples = [];
        this.waterRipples = [];
    }

    addSteam(x, y, vx = 0, vy = -1.2, size = 12, maxLife = 45, color = 'rgba(215, 230, 240, 0.55)') {
        this.particles.push({
            type: 'steam',
            x: x + (Math.random() * 8 - 4),
            y: y + (Math.random() * 8 - 4),
            vx: vx + (Math.random() * 0.8 - 0.4),
            vy: vy + (Math.random() * 0.5 - 0.25),
            size: size,
            growth: 0.45 + Math.random() * 0.25,
            alpha: 0.65 + Math.random() * 0.2,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            decay: 1 / maxLife,
            life: 1.0,
            color: color
        });
    }

    // Pressurized water spray burst from leaking pipes
    addWaterJet(x, y, vx = 0, vy = 2.5) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                type: 'water_spray',
                x: x + (Math.random() * 4 - 2),
                y: y,
                vx: vx + (Math.random() - 0.5) * 1.5,
                vy: vy + (Math.random() * 1.5),
                size: 2 + Math.random() * 3,
                growth: 0.05,
                alpha: 0.75 + Math.random() * 0.2,
                decay: 0.04 + Math.random() * 0.02,
                life: 1.0
            });
        }
    }

    // Expanding puddle ripple when water hits floor
    addWaterRipple(x, y, maxR = 24) {
        this.waterRipples.push({
            x: x,
            y: y,
            radius: 2,
            maxRadius: maxR,
            speed: 0.8 + Math.random() * 0.5,
            alpha: 0.7,
            life: 1.0
        });
    }

    addBubble(x, y) {
        this.particles.push({
            type: 'bubble',
            x: x + (Math.random() * 24 - 12),
            y: y,
            vx: Math.random() * 0.4 - 0.2,
            vy: -(0.9 + Math.random() * 1.4),
            size: 2.5 + Math.random() * 4.5,
            growth: 0.02,
            alpha: 0.65,
            decay: 0.014,
            life: 1.0,
            wobble: Math.random() * Math.PI * 2
        });
    }

    addSpark(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 5;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 2 + Math.random() * 2,
                growth: -0.06,
                alpha: 1.0,
                decay: 0.035 + Math.random() * 0.03,
                life: 1.0,
                color: Math.random() > 0.35 ? '#f7e28b' : '#ff9f43'
            });
        }
    }

    addSoundRipple(x, y, intensity = 0.5, isDanger = false) {
        this.soundRipples.push({
            x: x,
            y: y,
            radius: 12,
            maxRadius: 90 + intensity * 280,
            speed: 4.5 + intensity * 3.5,
            intensity: intensity,
            alpha: 0.85,
            isDanger: isDanger,
            life: 1.0
        });
    }

    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.size += p.growth;
            p.life -= p.decay;

            if (p.type === 'steam') {
                p.rotation += p.rotSpeed;
                p.vx *= 0.98;
            } else if (p.type === 'water_spray') {
                p.vy += 0.12; // Gravity pulls water droplets down
                p.vx *= 0.96;
                // Floor splash
                if (p.life < 0.25 && Math.random() < 0.3) {
                    this.addWaterRipple(p.x, p.y + 4, 18);
                }
            } else if (p.type === 'bubble') {
                p.wobble += 0.12;
                p.x += Math.sin(p.wobble) * 0.6;
            }

            if (p.life <= 0 || p.size <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update puddle ripples
        for (let i = this.waterRipples.length - 1; i >= 0; i--) {
            const wr = this.waterRipples[i];
            wr.radius += wr.speed;
            wr.life = 1 - (wr.radius / wr.maxRadius);
            wr.alpha = wr.life * 0.6;

            if (wr.radius >= wr.maxRadius) {
                this.waterRipples.splice(i, 1);
            }
        }

        // Update sound acoustic ripples
        for (let i = this.soundRipples.length - 1; i >= 0; i--) {
            const r = this.soundRipples[i];
            r.radius += r.speed;
            r.life = 1 - (r.radius / r.maxRadius);
            r.alpha = r.life * (r.isDanger ? 0.95 : 0.65);

            if (r.radius >= r.maxRadius) {
                this.soundRipples.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        // Draw water puddle ripples on floor
        for (const wr of this.waterRipples) {
            const sx = wr.x - camera.x;
            const sy = wr.y - camera.y;

            ctx.save();
            ctx.beginPath();
            ctx.ellipse(sx, sy, wr.radius, wr.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(130, 225, 245, ${wr.alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }

        // Draw sound ripples
        for (const r of this.soundRipples) {
            const screenX = r.x - camera.x;
            const screenY = r.y - camera.y;

            ctx.save();
            ctx.beginPath();
            ctx.arc(screenX, screenY, r.radius, 0, Math.PI * 2);
            ctx.lineWidth = r.isDanger ? 3 : 1.5;
            ctx.strokeStyle = r.isDanger 
                ? `rgba(235, 60, 60, ${r.alpha})` 
                : `rgba(63, 224, 208, ${r.alpha * 0.75})`;
            ctx.stroke();

            if (r.radius > 35) {
                ctx.beginPath();
                ctx.arc(screenX, screenY, r.radius * 0.65, 0, Math.PI * 2);
                ctx.lineWidth = 1;
                ctx.strokeStyle = r.isDanger 
                    ? `rgba(235, 60, 60, ${r.alpha * 0.4})` 
                    : `rgba(63, 224, 208, ${r.alpha * 0.35})`;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            ctx.save();
            if (p.type === 'steam') {
                const rad = Math.max(2, p.size);
                const steamGrad = ctx.createRadialGradient(screenX, screenY, rad * 0.15, screenX, screenY, rad);
                const baseAlpha = p.alpha * p.life;
                steamGrad.addColorStop(0, `rgba(230, 240, 250, ${baseAlpha * 0.7})`);
                steamGrad.addColorStop(0.5, `rgba(180, 200, 220, ${baseAlpha * 0.35})`);
                steamGrad.addColorStop(1, 'rgba(150, 180, 200, 0)');

                ctx.beginPath();
                ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
                ctx.fillStyle = steamGrad;
                ctx.fill();
            } else if (p.type === 'water_spray') {
                // Shiny realistic water droplets
                ctx.beginPath();
                ctx.arc(screenX, screenY, Math.max(1, p.size), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(160, 235, 255, ${p.alpha * p.life})`;
                ctx.fill();
            } else if (p.type === 'bubble') {
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 245, 255, ${p.alpha * p.life * 0.55})`;
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * p.life * 0.85})`;
                ctx.stroke();
            } else if (p.type === 'spark') {
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

const particles = new ParticleSystem();
