/**
 * Realistic Environmental Hazards & Interactive Objects
 * Uses realistic sprites for chests, crabs, terminals, and hazards.
 */

// Realistic Mechanical Steam Crab Automaton
class SteamCrab {
    constructor(x, y, axis = 'x', distance = 160) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.axis = axis;
        this.distance = distance;
        this.direction = 1;
        this.speed = 1.1;
        this.radius = 18;
        this.walkCycle = 0;
        this.width = 44;
        this.height = 34;
    }

    update(player, particles) {
        this.walkCycle += 0.15;
        if (this.axis === 'x') {
            this.x += this.speed * this.direction;
            if (Math.abs(this.x - this.startX) > this.distance) {
                this.direction *= -1;
            }
        } else {
            this.y += this.speed * this.direction;
            if (Math.abs(this.y - this.startY) > this.distance) {
                this.direction *= -1;
            }
        }

        if (Math.random() < 0.04) {
            particles.addSteam(this.x, this.y - 6, 0, -0.6, 6, 18, 'rgba(200, 220, 230, 0.4)');
        }

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < this.radius + player.radius) {
            player.takeDamage(12);
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 8, 18, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        // Realistic Crab Sprite from steampunk_assets.jpg
        const flipX = this.direction < 0;
        const drawn = sprites.draw(ctx, 'crab', screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, flipX);

        if (!drawn) {
            // Procedural fallback
            ctx.translate(screenX, screenY);
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#8f5c2a';
            ctx.fill();
        }

        // Glowing red ocular sensors
        const eyeX = flipX ? screenX - 10 : screenX + 10;
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(eyeX, screenY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// Realistic Steampunk Equipment Chest
class ItemChest {
    constructor(x, y, itemId, itemName, itemIcon = '⚙️', keyTag = 'KEY') {
        this.x = x;
        this.y = y;
        this.radius = 24;
        this.itemId = itemId;
        this.itemName = itemName;
        this.itemIcon = itemIcon;
        this.keyTag = keyTag;
        this.opened = false;
        this.width = 46;
        this.height = 36;
    }

    interact(player) {
        if (!this.opened) {
            this.opened = true;
            player.addItem(this.itemId);
            particles.addSpark(this.x, this.y, 14);
            return `Acquired: ${this.itemName}!`;
        }
        return `Chest is empty.`;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 12, 24, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();

        // Draw realistic chest sprite from realistic_assets.jpg
        const drawn = sprites.draw(ctx, 'chest', screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, false, this.opened ? 0.75 : 1.0);

        if (!drawn) {
            ctx.fillStyle = this.opened ? '#4a3219' : '#734d26';
            ctx.fillRect(screenX - 16, screenY - 12, 32, 24);
        }

        // Floating Golden Key Indicator if unopened
        if (!this.opened) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, 26, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(247, 226, 139, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Floating Key Badge above chest
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 6;
            ctx.fillText(this.keyTag, screenX, screenY - 22);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

// Station Pressure Regulation Terminal
class PressureTerminal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.width = 44;
        this.height = 56;
    }

    draw(ctx, camera, stabilized) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 18, 22, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();

        // Render realistic gauge stand / valve lever sprite
        const drawn = sprites.draw(ctx, 'gauge_stand', screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);

        if (!drawn) {
            ctx.fillStyle = '#261b11';
            ctx.fillRect(screenX - 20, screenY - 24, 40, 48);
        }

        // Status indicator beacon
        const beaconColor = stabilized ? '#2ecc71' : '#ff9f43';
        ctx.fillStyle = beaconColor;
        ctx.shadowColor = beaconColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(screenX, screenY - 14, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// Main Escape Blast Door Hatch Terminal
class EscapeHatch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 38;
    }

    draw(ctx, camera, panelUnlocked, pressureStabilized) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Massive circular blast door rim
        ctx.beginPath();
        ctx.arc(screenX, screenY, 36, 0, Math.PI * 2);
        ctx.fillStyle = '#1e140c';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#8a652a';
        ctx.stroke();

        // Hydraulic lock spokes
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + Math.cos(a) * 30, screenY + Math.sin(a) * 30);
            ctx.stroke();
        }

        // Center Key Cylinder
        ctx.beginPath();
        ctx.arc(screenX, screenY, 14, 0, Math.PI * 2);
        ctx.fillStyle = panelUnlocked ? '#2ecc71' : '#d4af37';
        ctx.fill();
        ctx.stroke();

        // Status beacon
        ctx.fillStyle = (panelUnlocked && pressureStabilized) ? '#2ecc71' : '#e74c3c';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}
