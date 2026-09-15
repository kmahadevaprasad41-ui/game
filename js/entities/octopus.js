/**
 * Realistic Mobile Steam Octopus Boss ("The Dreadnought Automaton")
 * Renders using the high-definition tracked dreadnought boss sprite from realistic_assets.jpg.
 * Features realistic tank-tread rolling vibration, dual billowing steam exhaust funnels,
 * and high-intensity red ocular searchlight beams.
 */
class SteamOctopus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 46;
        this.angle = 0;
        this.targetAngle = 0;

        this.speed = 1.4;
        this.patrolSpeed = 1.4;
        this.investigateSpeed = 2.4;
        this.huntSpeed = 3.6;

        this.state = 'PATROL'; // 'PATROL', 'INVESTIGATE', 'HUNT', 'SEARCH'
        this.searchTimer = 0;
        this.targetX = x;
        this.targetY = y;

        // Waypoints for patrol loop
        this.waypoints = [
            { x: 14 * 64, y: 6 * 64 },
            { x: 27 * 64, y: 6 * 64 },
            { x: 27 * 64, y: 14 * 64 },
            { x: 14 * 64, y: 14 * 64 },
            { x: 4 * 64, y: 14 * 64 },
            { x: 4 * 64, y: 6 * 64 }
        ];
        this.currentWaypointIndex = 0;

        this.walkCycle = 0;
        this.steamTimer = 0;
        this.soundCheckTimer = 0;
        this.huntAlarmCooldown = 0;

        // Visual sprite dimensions
        this.spriteWidth = 118;
        this.spriteHeight = 104;
    }

    update(player, map, particles) {
        this.walkCycle += 0.08;
        this.steamTimer++;
        if (this.huntAlarmCooldown > 0) this.huntAlarmCooldown--;

        // Dual chimney steam exhaust plumes
        if (this.steamTimer % 6 === 0) {
            const chimneyOffsetX = Math.cos(this.angle + Math.PI) * 28;
            const chimneyOffsetY = Math.sin(this.angle + Math.PI) * 28;

            particles.addSteam(
                this.x + chimneyOffsetX + (Math.random() - 0.5) * 16,
                this.y + chimneyOffsetY - 18,
                (Math.random() - 0.5) * 1.2,
                -(1.6 + Math.random()),
                14,
                38,
                this.state === 'HUNT' ? 'rgba(230, 200, 180, 0.7)' : 'rgba(190, 200, 210, 0.55)'
            );
        }

        // Distance to player
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // Acoustic Sensing (Listens for sound vibrations)
        this.soundCheckTimer++;
        if (this.soundCheckTimer >= 6) {
            this.soundCheckTimer = 0;
            for (const ripple of particles.soundRipples) {
                const distToRipple = Math.hypot(ripple.x - this.x, ripple.y - this.y);
                const hearingRadius = ripple.maxRadius + 140;
                if (distToRipple < hearingRadius) {
                    if (this.state !== 'HUNT') {
                        this.state = 'INVESTIGATE';
                        this.targetX = ripple.x;
                        this.targetY = ripple.y;
                        if (ripple.isDanger && this.huntAlarmCooldown === 0) {
                            sounds.playAlarmKlaxon();
                            this.huntAlarmCooldown = 180;
                        }
                    }
                }
            }
        }

        // Line-of-sight & proximity check for HUNT mode
        if (distToPlayer < 260) {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            let angleDiff = Math.abs(this.angle - angleToPlayer);
            while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

            const hasVision = angleDiff < Math.PI / 2.3 && !this.checkWallBetween(this.x, this.y, player.x, player.y, map);
            const loudNearby = distToPlayer < 150 && player.currentMode === 'sprint';

            if (hasVision || loudNearby) {
                if (this.state !== 'HUNT') {
                    sounds.playOctopusRoar();
                    if (this.huntAlarmCooldown === 0) {
                        sounds.playAlarmKlaxon();
                        this.huntAlarmCooldown = 120;
                    }
                }
                this.state = 'HUNT';
                this.targetX = player.x;
                this.targetY = player.y;
            }
        }

        // State Machine execution
        if (this.state === 'PATROL') {
            this.speed = this.patrolSpeed;
            const wp = this.waypoints[this.currentWaypointIndex];
            this.targetX = wp.x;
            this.targetY = wp.y;

            if (Math.hypot(wp.x - this.x, wp.y - this.y) < 30) {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            }
        } else if (this.state === 'INVESTIGATE') {
            this.speed = this.investigateSpeed;
            if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 35) {
                this.state = 'SEARCH';
                this.searchTimer = 180;
            }
        } else if (this.state === 'SEARCH') {
            this.speed = 0;
            this.targetAngle += 0.03;
            this.searchTimer--;
            if (this.searchTimer <= 0) {
                this.state = 'PATROL';
            }
        } else if (this.state === 'HUNT') {
            this.speed = this.huntSpeed;
            this.targetX = player.x;
            this.targetY = player.y;

            if (distToPlayer > 400 && player.currentMode === 'sneak') {
                this.state = 'SEARCH';
                this.searchTimer = 120;
            }
        }

        // Steer towards target
        if (this.state !== 'SEARCH') {
            this.targetAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        }

        // Smooth rotation
        let dAngle = this.targetAngle - this.angle;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        this.angle += dAngle * 0.08;

        // Forward movement with obstacle avoidance
        if (this.speed > 0) {
            const moveX = Math.cos(this.angle) * this.speed;
            const moveY = Math.sin(this.angle) * this.speed;

            if (!map.checkCircleCollision(this.x + moveX, this.y, this.radius)) {
                this.x += moveX;
            }
            if (!map.checkCircleCollision(this.x, this.y + moveY, this.radius)) {
                this.y += moveY;
            }
        }

        // Collision with player
        if (distToPlayer < this.radius + player.radius) {
            player.takeDamage(40);
            const pushAngle = Math.atan2(player.y - this.y, player.x - this.x);
            player.x += Math.cos(pushAngle) * 22;
            player.y += Math.sin(pushAngle) * 22;
        }
    }

    checkWallBetween(x1, y1, x2, y2, map) {
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const testX = x1 + (x2 - x1) * t;
            const testY = y1 + (y2 - y1) * t;
            if (map.isSolid(testX, testY)) return true;
        }
        return false;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // 1. Realistic Heavy Dreadnought Ground Shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 28, 56, 26, 0, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(screenX, screenY + 28, 5, screenX, screenY + 28, 56);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // 2. Determine realistic sprite orientation
        const isFacingLeft = Math.cos(this.angle) < 0;
        const spriteName = isFacingLeft ? 'octopus_left' : 'octopus_right';

        const drawX = screenX - this.spriteWidth / 2;
        const drawY = screenY - this.spriteHeight / 2 - 6;

        const rendered = sprites.draw(ctx, spriteName, drawX, drawY, this.spriteWidth, this.spriteHeight, false);

        // Fallback procedural boss if sprites loading
        if (!rendered) {
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fillStyle = '#8f5c2a';
            ctx.fill();
            ctx.restore();
        }

        // 3. Realistic Ocular Red Headlights & Lens Flare
        const isHunting = this.state === 'HUNT';
        const eyeColor = isHunting ? '#ff1e1e' : (this.state === 'INVESTIGATE' ? '#ff9900' : '#e74c3c');
        const eyeRadius = isHunting ? 12 : 7;

        // Front headlights position
        const eyeOffsetDist = 24;
        const eye1X = screenX + Math.cos(this.angle - 0.28) * eyeOffsetDist;
        const eye1Y = screenY + Math.sin(this.angle - 0.28) * eyeOffsetDist - 6;
        const eye2X = screenX + Math.cos(this.angle + 0.28) * eyeOffsetDist;
        const eye2Y = screenY + Math.sin(this.angle + 0.28) * eyeOffsetDist - 6;

        [ { x: eye1X, y: eye1Y }, { x: eye2X, y: eye2Y } ].forEach(pt => {
            const glow = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, eyeRadius * 2);
            glow.addColorStop(0, eyeColor);
            glow.addColorStop(0.4, isHunting ? 'rgba(255, 30, 30, 0.7)' : 'rgba(231, 76, 60, 0.4)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, eyeRadius * 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    // High-Intensity Red Ocular Searchlight Beams
    drawOcularLights(lightCtx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        lightCtx.save();
        const beamDist = this.state === 'HUNT' ? 320 : 220;
        const coneAngle = Math.PI / 4.2;
        const eyeAlpha = this.state === 'HUNT' ? 0.95 : 0.65;

        const eyeGrad = lightCtx.createRadialGradient(screenX, screenY, 15, screenX, screenY, beamDist);
        eyeGrad.addColorStop(0, `rgba(255, 40, 40, ${eyeAlpha})`);
        eyeGrad.addColorStop(0.4, `rgba(230, 30, 30, ${eyeAlpha * 0.6})`);
        eyeGrad.addColorStop(0.8, `rgba(180, 10, 10, ${eyeAlpha * 0.2})`);
        eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lightCtx.beginPath();
        lightCtx.moveTo(screenX, screenY);
        lightCtx.arc(screenX, screenY, beamDist, this.angle - coneAngle, this.angle + coneAngle);
        lightCtx.closePath();
        lightCtx.fillStyle = eyeGrad;
        lightCtx.fill();

        lightCtx.restore();
    }
}
