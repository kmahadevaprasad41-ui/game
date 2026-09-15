/**
 * Realistic Steampunk Heavy Diver Player Entity
 * Uses high-definition realistic diver sprites from the asset sheets with 4-way orientation,
 * Oxygen (O2) survival meter, water puddle splash reactions, cyan visor bloom, and volumetric lantern light.
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
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

        this.speed = 3.0;
        this.noiseLevel = 0.25;
        this.currentMode = 'walk'; // 'sneak', 'walk', 'sprint'

        this.facing = 'down';
        this.lanternOn = true;
        this.inventory = [];

        this.walkCycle = 0;
        this.stepTimer = 0;
        this.invulnerableTimer = 0;

        // Progress flags
        this.keyAssembled = false;
        this.pressureStabilized = false;
        this.hatchUnlocked = false;

        this.spriteWidth = 52;
        this.spriteHeight = 74;
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
        this.invulnerableTimer = 60;
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
            this.speed = 5.2;
            this.noiseLevel = 0.85;
            this.steam = Math.max(0, this.steam - 0.35);
        } else if (isSneaking) {
            this.currentMode = 'sneak';
            this.speed = 1.6;
            this.noiseLevel = 0.05;
            this.steam = Math.min(this.maxSteam, this.steam + 0.15);
        } else {
            this.currentMode = 'walk';
            this.speed = 3.0;
            this.noiseLevel = 0.25;
            this.steam = Math.min(this.maxSteam, this.steam + 0.2);
        }

        // Movement
        const { dx, dy } = input.getMovementVector();
        const isMoving = (dx !== 0 || dy !== 0);

        if (isMoving) {
            const newX = this.x + dx * this.speed;
            const newY = this.y + dy * this.speed;

            if (!map.checkCircleCollision(newX, this.y, this.radius)) {
                this.x = newX;
            }
            if (!map.checkCircleCollision(this.x, newY, this.radius)) {
                this.y = newY;
            }

            this.walkCycle += (this.currentMode === 'sprint' ? 0.35 : this.currentMode === 'sneak' ? 0.12 : 0.22);

            if (Math.abs(dx) > Math.abs(dy)) {
                this.facing = dx > 0 ? 'right' : 'left';
            } else {
                this.facing = dy > 0 ? 'down' : 'up';
            }

            // Step sound & acoustic ripple
            this.stepTimer++;
            const stepThreshold = this.currentMode === 'sprint' ? 14 : this.currentMode === 'sneak' ? 32 : 22;
            if (this.stepTimer >= stepThreshold) {
                this.stepTimer = 0;
                sounds.playFootstep(this.currentMode);

                const intensity = this.currentMode === 'sprint' ? 0.95 : this.currentMode === 'sneak' ? 0.08 : 0.45;
                const isDanger = this.currentMode === 'sprint';
                particles.addSoundRipple(this.x, this.y + 16, intensity, isDanger);

                // Splash water ripple if walking on flooded area or catwalk
                particles.addWaterRipple(this.x, this.y + 20, 16);
            }

            // Sprint steam exhaust plumes
            if (this.currentMode === 'sprint' && Math.random() < 0.45) {
                particles.addSteam(this.x, this.y - 12, (Math.random() - 0.5) * 0.8, -1.2, 8, 24);
            }
        } else {
            this.stepTimer = 0;
            this.noiseLevel = 0.0;
        }

        // Aim angle towards mouse
        const mouseWorldX = input.mouse.x + camera.x;
        const mouseWorldY = input.mouse.y + camera.y;
        this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

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

        // Ambient underwater bubbles from diver helmet valve
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

        // 1. Realistic Soft Drop Shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 26, 22, 10, 0, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(screenX, screenY + 26, 2, screenX, screenY + 26, 22);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // 2. Realistic Walking Bob
        const bob = Math.sin(this.walkCycle) * (this.currentMode === 'sprint' ? 4 : 2);

        // 3. Render Realistic Diver Sprite
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

        const drawX = screenX - this.spriteWidth / 2;
        const drawY = screenY - this.spriteHeight / 2 + bob;

        const rendered = sprites.draw(ctx, spriteName, drawX, drawY, this.spriteWidth, this.spriteHeight, flipX);

        if (!rendered) {
            ctx.save();
            ctx.translate(screenX, screenY + bob);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(-14, -14, 28, 28);
            ctx.fillStyle = '#a87a32';
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // 4. Glowing Cyan Visor Ocular Light Halo
        if (this.facing !== 'up') {
            const visorOffset = this.facing === 'right' ? 10 : (this.facing === 'left' ? -10 : 0);
            const visorX = screenX + visorOffset;
            const visorY = screenY - 14 + bob;

            ctx.save();
            const visorGlow = ctx.createRadialGradient(visorX, visorY, 1, visorX, visorY, 14);
            visorGlow.addColorStop(0, 'rgba(63, 224, 208, 0.85)');
            visorGlow.addColorStop(0.5, 'rgba(63, 224, 208, 0.35)');
            visorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = visorGlow;
            ctx.beginPath();
            ctx.arc(visorX, visorY, 14, 0, Math.PI * 2);
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

        const ambientGrad = lightCtx.createRadialGradient(screenX, screenY, 12, screenX, screenY, 135);
        ambientGrad.addColorStop(0, 'rgba(255, 240, 195, 0.85)');
        ambientGrad.addColorStop(0.5, 'rgba(235, 200, 120, 0.4)');
        ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lightCtx.beginPath();
        lightCtx.arc(screenX, screenY, 135, 0, Math.PI * 2);
        lightCtx.fillStyle = ambientGrad;
        lightCtx.fill();

        const beamDist = 340;
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
