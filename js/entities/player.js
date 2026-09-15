/**
 * Realistic Steampunk Heavy Diver Player Entity
 * Implements physics-based underwater momentum, animated heavy diving suit gait,
 * dual-boot stepping animations, torso lean, breathing chest heave,
 * cyan visor lens flare, dynamic water footstep splashes, and volumetric lantern light.
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 24;
        this.angle = 0;

        this.health = 100;
        this.maxHealth = 100;
        this.steam = 100;
        this.maxSteam = 100;

        // Oxygen (O2) Survival System
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.lowOxygenAlarmTimer = 0;

        this.targetSpeed = 3.0;
        this.noiseLevel = 0.25;
        this.currentMode = 'walk'; // 'sneak', 'walk', 'sprint'

        this.facing = 'down';
        this.lanternOn = true;
        this.inventory = [];

        // Animation states
        this.walkCycle = 0;
        this.stepTimer = 0;
        this.breathTimer = 0;
        this.bodyTilt = 0;
        this.invulnerableTimer = 0;

        // Progress flags
        this.keyAssembled = false;
        this.pressureStabilized = false;
        this.hatchUnlocked = false;

        this.spriteWidth = 54;
        this.spriteHeight = 76;
    }

    hasItem(id) {
        return this.inventory.includes(id);
    }

    addItem(id) {
        if (!this.inventory.includes(id)) {
            this.inventory.push(id);
            sounds.playPickup();
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        this.health = Math.max(0, this.health - amount);
        this.invulnerableTimer = 80; // Extended grace window to safely escape monster attacks
        sounds.playDamage();
        particles.addSpark(this.x, this.y, 10);
    }

    refillOxygen(amount = 100) {
        if (this.oxygen < 98) {
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + amount);
            sounds.playOxygenInhale();
            for (let i = 0; i < 8; i++) {
                particles.addBubble(this.x, this.y - 12);
            }
            return true;
        }
        return false;
    }

    update(input, map, camera) {
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        this.breathTimer += 0.04;

        // Oxygen depletion mechanics
        const o2DrainRate = (this.currentMode === 'sprint') ? 0.085 : 0.04;
        this.oxygen = Math.max(0, this.oxygen - o2DrainRate);

        // Low oxygen warning alarm
        if (this.oxygen <= 20 && this.oxygen > 0) {
            this.lowOxygenAlarmTimer++;
            if (this.lowOxygenAlarmTimer >= 80) {
                this.lowOxygenAlarmTimer = 0;
                sounds.playOxygenLowAlarm();
            }
        }

        // Suffocation damage when O2 runs out
        if (this.oxygen <= 0) {
            this.health = Math.max(0, this.health - 0.22);
            if (Math.random() < 0.1) {
                sounds.playDamage();
            }
        }

        // Mode determination
        const isSprinting = input.isSprinting() && this.steam > 5;
        const isSneaking = input.isSneaking();

        if (isSprinting) {
            this.currentMode = 'sprint';
            this.targetSpeed = 5.5;
            this.noiseLevel = 0.85;
            this.steam = Math.max(0, this.steam - 0.35);
        } else if (isSneaking) {
            this.currentMode = 'sneak';
            this.targetSpeed = 1.8;
            this.noiseLevel = 0.05;
            this.steam = Math.min(this.maxSteam, this.steam + 0.15);
        } else {
            this.currentMode = 'walk';
            this.targetSpeed = 3.3;
            this.noiseLevel = 0.25;
            this.steam = Math.min(this.maxSteam, this.steam + 0.2);
        }

        // Physics-based underwater momentum & acceleration
        const { dx, dy } = input.getMovementVector();
        const accel = this.currentMode === 'sprint' ? 0.35 : 0.25;
        const friction = 0.82; // underwater drag

        if (dx !== 0 || dy !== 0) {
            this.vx += dx * accel * this.targetSpeed;
            this.vy += dy * accel * this.targetSpeed;

            // Clamp max velocity
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > this.targetSpeed) {
                this.vx = (this.vx / currentSpeed) * this.targetSpeed;
                this.vy = (this.vy / currentSpeed) * this.targetSpeed;
            }
        } else {
            // Apply drag/deceleration
            this.vx *= friction;
            this.vy *= friction;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
            if (Math.abs(this.vy) < 0.05) this.vy = 0;
        }

        const actualSpeed = Math.hypot(this.vx, this.vy);
        const isMoving = actualSpeed > 0.2;

        if (isMoving) {
            const newX = this.x + this.vx;
            const newY = this.y + this.vy;

            // Slide along walls
            if (!map.checkCircleCollision(newX, this.y, this.radius)) {
                this.x = newX;
            } else {
                this.vx = 0;
            }

            if (!map.checkCircleCollision(this.x, newY, this.radius)) {
                this.y = newY;
            } else {
                this.vy = 0;
            }

            // Advance walk cycle based on velocity
            this.walkCycle += actualSpeed * 0.06;

            // Body tilt into velocity
            this.bodyTilt = (this.vx / this.targetSpeed) * 0.12;

            // Determine primary facing direction
            if (Math.abs(this.vx) > Math.abs(this.vy)) {
                this.facing = this.vx > 0 ? 'right' : 'left';
            } else {
                this.facing = this.vy > 0 ? 'down' : 'up';
            }

            // Footstep timing & water splash ripples
            this.stepTimer += actualSpeed;
            const stepThreshold = this.currentMode === 'sprint' ? 45 : this.currentMode === 'sneak' ? 70 : 55;
            if (this.stepTimer >= stepThreshold) {
                this.stepTimer = 0;
                sounds.playFootstep(this.currentMode);

                const intensity = this.currentMode === 'sprint' ? 0.95 : this.currentMode === 'sneak' ? 0.08 : 0.45;
                const isDanger = this.currentMode === 'sprint';
                particles.addSoundRipple(this.x, this.y + 16, intensity, isDanger);

                // Water splash ripple from heavy boot step
                particles.addWaterRipple(this.x + (Math.sin(this.walkCycle) > 0 ? 8 : -8), this.y + 24, 18);
            }

            // Sprint steam exhaust plumes from twin oxygen tanks
            if (this.currentMode === 'sprint' && Math.random() < 0.45) {
                particles.addSteam(this.x, this.y - 12, (Math.random() - 0.5) * 0.8, -1.2, 8, 24);
            }
        } else {
            this.stepTimer = 0;
            this.bodyTilt *= 0.8;
            this.noiseLevel = 0.0;
        }

        // Aim angle towards mouse
        const mouseWorldX = input.mouse.x + camera.x;
        const mouseWorldY = input.mouse.y + camera.y;
        this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

        // If standing still, facing follows mouse
        if (!isMoving) {
            const rad = this.angle;
            if (rad > -Math.PI * 0.25 && rad < Math.PI * 0.25) this.facing = 'right';
            else if (rad >= Math.PI * 0.25 && rad <= Math.PI * 0.75) this.facing = 'down';
            else if (rad >= -Math.PI * 0.75 && rad <= -Math.PI * 0.25) this.facing = 'up';
            else this.facing = 'left';
        }

        // Toggle lantern
        if (input.isLanternToggle()) {
            this.lanternOn = !this.lanternOn;
            sounds.playGearClick();
        }

        // Check proximity to Oxygen Stations
        for (const st of map.oxygenStations) {
            if (Math.hypot(this.x - st.x, this.y - st.y) < st.radius + 15) {
                if (input.isInteracting() || this.oxygen < 40) {
                    this.refillOxygen(100);
                }
            }
        }

        // Ambient underwater bubbles from helmet valve
        if (Math.random() < 0.09) {
            particles.addBubble(this.x, this.y - 18);
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 1. Dynamic Gait Cycle & Stepping Boots
        const leftLegPhase = Math.sin(this.walkCycle);
        const rightLegPhase = -leftLegPhase;
        const speedRatio = Math.hypot(this.vx, this.vy) / this.targetSpeed;
        const stride = speedRatio * 14;

        // Left Boot ground shadow & footprint
        ctx.beginPath();
        ctx.ellipse(screenX - 10, screenY + 26 + leftLegPhase * stride * 0.4, 12, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();

        // Right Boot ground shadow
        ctx.beginPath();
        ctx.ellipse(screenX + 10, screenY + 26 + rightLegPhase * stride * 0.4, 12, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();

        // Heavy Bronze Diver Boots (Stepping Animation)
        if (speedRatio > 0.1) {
            // Left boot
            ctx.fillStyle = '#8a652a';
            ctx.beginPath();
            ctx.roundRect(screenX - 14, screenY + 22 + leftLegPhase * stride * 0.4, 8, 10, 2);
            ctx.fill();
            ctx.strokeStyle = '#4a3517';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Right boot
            ctx.beginPath();
            ctx.roundRect(screenX + 6, screenY + 22 + rightLegPhase * stride * 0.4, 8, 10, 2);
            ctx.fill();
            ctx.stroke();
        }

        // 2. Realistic Walking Vertical Bob & Chest Breathing Heave
        const verticalBob = Math.abs(Math.sin(this.walkCycle)) * 4 * speedRatio;
        const chestBreath = Math.sin(this.breathTimer) * 0.02;

        ctx.translate(screenX, screenY - verticalBob);
        ctx.rotate(this.bodyTilt);
        ctx.scale(1 + chestBreath, 1 + chestBreath);

        // 3. Render Realistic Heavy Diver Sprite
        let spriteName = 'player_front';
        let flipX = false;

        if (this.facing === 'up') {
            spriteName = 'player_back';
        } else if (this.facing === 'right') {
            spriteName = 'player_side';
        } else if (this.facing === 'left') {
            spriteName = 'player_side';
            flipX = true;
        }

        const drawX = -this.spriteWidth / 2;
        const drawY = -this.spriteHeight / 2;

        const rendered = sprites.draw(ctx, spriteName, drawX, drawY, this.spriteWidth, this.spriteHeight, flipX);

        if (!rendered) {
            // Procedural fallback
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(-14, -14, 28, 28);
            ctx.fillStyle = '#a87a32';
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        }

        // 4. Glowing Cyan Visor Ocular Light Halo
        if (this.facing !== 'up') {
            const visorOffset = this.facing === 'right' ? 10 : (this.facing === 'left' ? -10 : 0);
            const visorX = visorOffset;
            const visorY = -14;

            ctx.save();
            const visorGlow = ctx.createRadialGradient(visorX, visorY, 1, visorX, visorY, 16);
            visorGlow.addColorStop(0, 'rgba(63, 224, 208, 0.9)');
            visorGlow.addColorStop(0.5, 'rgba(63, 224, 208, 0.4)');
            visorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = visorGlow;
            ctx.beginPath();
            ctx.arc(visorX, visorY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    drawLanternLight(lightCtx, camera) {
        if (!this.lanternOn) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        lightCtx.save();

        // Warm ambient aura
        const ambientGrad = lightCtx.createRadialGradient(screenX, screenY, 12, screenX, screenY, 140);
        ambientGrad.addColorStop(0, 'rgba(255, 240, 195, 0.85)');
        ambientGrad.addColorStop(0.5, 'rgba(235, 200, 120, 0.4)');
        ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lightCtx.beginPath();
        lightCtx.arc(screenX, screenY, 140, 0, Math.PI * 2);
        lightCtx.fillStyle = ambientGrad;
        lightCtx.fill();

        // Forward volumetric beam
        const beamDist = 350;
        const beamAngle = Math.PI / 4.0;

        const coneGrad = lightCtx.createRadialGradient(screenX, screenY, 20, screenX, screenY, beamDist);
        coneGrad.addColorStop(0, 'rgba(255, 248, 220, 0.98)');
        coneGrad.addColorStop(0.35, 'rgba(250, 215, 140, 0.7)');
        coneGrad.addColorStop(0.75, 'rgba(215, 170, 90, 0.3)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lightCtx.beginPath();
        lightCtx.moveTo(screenX, screenY);
        lightCtx.arc(screenX, screenY, beamDist, this.angle - beamAngle, this.angle + beamAngle);
        lightCtx.closePath();
        lightCtx.fillStyle = coneGrad;
        lightCtx.fill();

        lightCtx.restore();
    }
}
