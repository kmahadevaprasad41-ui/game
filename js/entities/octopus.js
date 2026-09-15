/**
 * Realistic Mobile Steam Octopus Boss ("The Dreadnought Automaton")
 * Features dynamic animated tank treads with rolling cogs, heavy boiler engine chassis rumble,
 * articulated reaching brass claws, chimney recoil steam blasts, and lunge attacks.
 */
class SteamOctopus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 34; // Agile collision radius so boss navigates all station corridors effortlessly
        this.angle = 0;
        this.targetAngle = 0;

        // Enhanced movement speeds (Faster, active patrol and chase)
        this.speed = 2.3;
        this.patrolSpeed = 2.3;
        this.investigateSpeed = 3.6;
        this.huntSpeed = 4.8;

        this.state = 'PATROL'; // 'PATROL', 'INVESTIGATE', 'HUNT', 'SEARCH'
        this.searchTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;

        // Comprehensive waypoints for full station patrol loop
        this.waypoints = [
            { x: 14 * 64 + 32, y: 6 * 64 + 32 },
            { x: 27 * 64 + 32, y: 6 * 64 + 32 },
            { x: 27 * 64 + 32, y: 14 * 64 + 32 },
            { x: 23 * 64 + 32, y: 20 * 64 + 32 },
            { x: 14 * 64 + 32, y: 20 * 64 + 32 },
            { x: 5 * 64 + 32, y: 20 * 64 + 32 },
            { x: 4 * 64 + 32, y: 14 * 64 + 32 },
            { x: 4 * 64 + 32, y: 6 * 64 + 32 }
        ];
        this.currentWaypointIndex = 0;

        // Animated movement states
        this.treadCycle = 0;
        this.chassisRumble = 0;
        this.clawCycle = 0;
        this.steamTimer = 0;
        this.soundCheckTimer = 0;
        this.huntAlarmCooldown = 0;
        this.lungeTimer = 0;

        this.spriteWidth = 120;
        this.spriteHeight = 106;
    }

    update(player, map, particles) {
        this.chassisRumble += this.state === 'HUNT' ? 0.35 : 0.16;
        this.clawCycle += 0.12;
        this.steamTimer++;
        if (this.huntAlarmCooldown > 0) this.huntAlarmCooldown--;
        if (this.lungeTimer > 0) this.lungeTimer--;

        // Dual chimney steam exhaust plumes with recoil
        const steamRate = this.state === 'HUNT' ? 4 : 8;
        if (this.steamTimer % steamRate === 0) {
            const chimneyOffsetX = Math.cos(this.angle + Math.PI) * 30;
            const chimneyOffsetY = Math.sin(this.angle + Math.PI) * 30;

            particles.addSteam(
                this.x + chimneyOffsetX + (Math.random() - 0.5) * 18,
                this.y + chimneyOffsetY - 20,
                (Math.random() - 0.5) * 1.5,
                -(1.8 + Math.random() * 1.2),
                16,
                40,
                this.state === 'HUNT' ? 'rgba(235, 205, 185, 0.75)' : 'rgba(195, 205, 215, 0.6)'
            );
        }

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // Acoustic Hearing
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
        if (distToPlayer < 280) {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            let angleDiff = Math.abs(this.angle - angleToPlayer);
            while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

            const hasVision = angleDiff < Math.PI / 2.2 && !this.checkWallBetween(this.x, this.y, player.x, player.y, map);
            const loudNearby = distToPlayer < 160 && player.currentMode === 'sprint';

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

                // Lunge rush attack if close
                if (distToPlayer < 180 && this.lungeTimer === 0) {
                    this.lungeTimer = 90;
                    sounds.playOctopusRoar();
                    particles.addSpark(this.x, this.y, 16);
                }
            }
        }

        // State machine speed and target determination
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
            this.targetAngle += 0.035;
            this.searchTimer--;
            if (this.searchTimer <= 0) {
                this.state = 'PATROL';
            }
        } else if (this.state === 'HUNT') {
            this.speed = (this.lungeTimer > 60) ? this.huntSpeed * 1.5 : this.huntSpeed;
            this.targetX = player.x;
            this.targetY = player.y;

            if (distToPlayer > 420 && player.currentMode === 'sneak') {
                this.state = 'SEARCH';
                this.searchTimer = 120;
            }
        }

        if (this.state !== 'SEARCH') {
            this.targetAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        }

        // Smooth turning
        let dAngle = this.targetAngle - this.angle;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        this.angle += dAngle * 0.09;

        // Advance tank tread animation cycle
        this.treadCycle += this.speed * 0.15;

        // Forward movement with obstacle collision & wall sliding
        if (this.speed > 0) {
            const moveX = Math.cos(this.angle) * this.speed;
            const moveY = Math.sin(this.angle) * this.speed;

            let moved = false;
            if (!map.checkCircleCollision(this.x + moveX, this.y, this.radius)) {
                this.x += moveX;
                moved = true;
            }
            if (!map.checkCircleCollision(this.x, this.y + moveY, this.radius)) {
                this.y += moveY;
                moved = true;
            }

            // Anti-stuck watchdog: If obstacle completely blocks forward progress, nudge around corner
            const actualMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
            this.lastX = this.x;
            this.lastY = this.y;

            if (actualMoved < 0.3) {
                this.stuckTimer++;
                if (this.stuckTimer > 30) {
                    this.angle += (Math.random() > 0.5 ? 1 : -1) * 0.8;
                    if (this.state === 'PATROL') {
                        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
                    }
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = Math.max(0, this.stuckTimer - 1);
            }

            // Track turning sparks on sharp turns
            if (Math.abs(dAngle) > 0.6 && Math.random() < 0.25) {
                particles.addSpark(this.x, this.y + 20, 3);
            }
        }

        // Damage player on contact (Substantially reduced damage: 12 HP instead of 40)
        if (distToPlayer < this.radius + player.radius) {
            player.takeDamage(12);
            const pushAngle = Math.atan2(player.y - this.y, player.x - this.x);
            player.vx = Math.cos(pushAngle) * 6;
            player.vy = Math.sin(pushAngle) * 6;
            player.x += Math.cos(pushAngle) * 28;
            player.y += Math.sin(pushAngle) * 28;
            particles.addSpark(player.x, player.y, 14);
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

        // 1. Heavy Dreadnought Ground Shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 30, 58, 28, 0, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(screenX, screenY + 30, 6, screenX, screenY + 30, 58);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // 2. Animated Tank Treads (Left and Right tracks with rolling teeth)
        const isMoving = this.speed > 0;
        const treadOffset = (this.treadCycle % 10);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Left track links
        ctx.fillStyle = '#1c1712';
        ctx.fillRect(-35, -38, 70, 14);
        ctx.strokeStyle = '#5a4225';
        ctx.lineWidth = 2;
        ctx.strokeRect(-35, -38, 70, 14);

        // Right track links
        ctx.fillRect(-35, 24, 70, 14);
        ctx.strokeRect(-35, 24, 70, 14);

        // Rolling track teeth
        ctx.fillStyle = '#8a652a';
        for (let tx = -30 + treadOffset; tx < 32; tx += 10) {
            ctx.fillRect(tx, -37, 4, 12);
            ctx.fillRect(tx, 25, 4, 12);
        }

        // 3. Articulated Reaching Brass Claws / Tentacles
        const clawWiggle = Math.sin(this.clawCycle) * 8;
        const lungeExtend = (this.lungeTimer > 60) ? 18 : 0;

        [-18, 18].forEach(cy => {
            ctx.save();
            ctx.strokeStyle = '#8a652a';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            // Arm segment 1
            ctx.beginPath();
            ctx.moveTo(15, cy);
            ctx.lineTo(35 + lungeExtend, cy + clawWiggle * 0.4);
            ctx.lineTo(50 + lungeExtend, cy + clawWiggle);
            ctx.stroke();

            // Pincer Claws
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(50 + lungeExtend, cy + clawWiggle);
            ctx.lineTo(58 + lungeExtend, cy + clawWiggle - 6);
            ctx.moveTo(50 + lungeExtend, cy + clawWiggle);
            ctx.lineTo(58 + lungeExtend, cy + clawWiggle + 6);
            ctx.stroke();

            ctx.restore();
        });

        ctx.restore();

        // 4. Engine Chassis Vibration & Thrum
        const engineRumble = Math.sin(this.chassisRumble) * (this.state === 'HUNT' ? 3.5 : 1.8);

        // 5. Draw Realistic Octopus Boss Sprite
        const isFacingLeft = Math.cos(this.angle) < 0;
        const spriteName = isFacingLeft ? 'octopus_left' : 'octopus_right';

        const drawX = screenX - this.spriteWidth / 2;
        const drawY = screenY - this.spriteHeight / 2 - 6 + engineRumble;

        const rendered = sprites.draw(ctx, spriteName, drawX, drawY, this.spriteWidth, this.spriteHeight, false);

        if (!rendered) {
            ctx.save();
            ctx.translate(screenX, screenY + engineRumble);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fillStyle = '#8f5c2a';
            ctx.fill();
            ctx.restore();
        }

        // 6. Glowing Red Cyclopean Headlights & Lens Flares
        const isHunting = this.state === 'HUNT';
        const eyeColor = isHunting ? '#ff1e1e' : (this.state === 'INVESTIGATE' ? '#ff9900' : '#e74c3c');
        const eyeRadius = isHunting ? 14 : 8;

        const eyeDist = 26;
        const eye1X = screenX + Math.cos(this.angle - 0.28) * eyeDist;
        const eye1Y = screenY + Math.sin(this.angle - 0.28) * eyeDist - 6 + engineRumble;
        const eye2X = screenX + Math.cos(this.angle + 0.28) * eyeDist;
        const eye2Y = screenY + Math.sin(this.angle + 0.28) * eyeDist - 6 + engineRumble;

        [ { x: eye1X, y: eye1Y }, { x: eye2X, y: eye2Y } ].forEach(pt => {
            const glow = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, eyeRadius * 2);
            glow.addColorStop(0, eyeColor);
            glow.addColorStop(0.35, isHunting ? 'rgba(255, 30, 30, 0.8)' : 'rgba(231, 76, 60, 0.45)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, eyeRadius * 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    drawOcularLights(lightCtx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        lightCtx.save();
        const beamDist = this.state === 'HUNT' ? 330 : 230;
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
