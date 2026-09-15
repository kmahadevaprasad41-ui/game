/**
 * Realistic Steampunk Station Map & Level Layout
 * Uses high-definition realistic tiles, industrial rusted walls, catwalk grates,
 * pressurized leaking water pipes, oxygen replenishment stations, and dynamic caustics.
 */
class GameMap {
    constructor() {
        this.tileSize = 64;
        this.cols = 32;
        this.rows = 24;
        this.width = this.cols * this.tileSize;
        this.height = this.rows * this.tileSize;

        this.causticTimer = 0;
        this.grid = [];
        this.initLayout();

        // Leaking Water Pipes (High pressure water jets spraying from joints)
        this.waterLeaks = [
            { x: 8 * 64 + 32, y: 10 * 64 - 10, dirX: 0.2, dirY: 2.8, puddles: [] },
            { x: 18 * 64 + 32, y: 10 * 64 - 10, dirX: -0.4, dirY: 3.2, puddles: [] },
            { x: 25 * 64 + 32, y: 10 * 64 - 10, dirX: 0.5, dirY: 2.6, puddles: [] },
            { x: 11 * 64, y: 5 * 64 + 20, dirX: 2.2, dirY: 1.4, puddles: [] },
            { x: 16 * 64, y: 18 * 64 + 10, dirX: -1.8, dirY: 2.2, puddles: [] }
        ];

        // Oxygen Recharge Canister Stations (High pressure air tanks)
        this.oxygenStations = [
            { x: 13.5 * 64, y: 6.5 * 64, radius: 36, name: 'Main Airlock O2 Terminal' },
            { x: 2.5 * 64, y: 14.5 * 64, radius: 36, name: 'West Wing Emergency O2 Tank' },
            { x: 28.5 * 64, y: 14.5 * 64, radius: 36, name: 'East Catwalk O2 Reservoir' }
        ];
    }

    initLayout() {
        this.grid = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,5,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1],
            [1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
            [1,1,1,1,0,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,1,0,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
            [1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1],
            [1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1],
            [1,1,1,1,0,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,1,0,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [1,1,0,0,3,3,0,0,1,1,0,0,0,3,3,0,0,0,1,1,0,0,3,3,0,0,0,0,1,1,1,1],
            [1,1,0,0,3,3,0,0,1,1,0,0,0,3,3,0,0,0,1,1,0,0,3,3,0,0,0,0,1,1,1,1],
            [1,1,1,1,0,0,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,1],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        this.steamVents = [
            { col: 4, row: 16, active: true, timer: 0 },
            { col: 5, row: 17, active: true, timer: 30 },
            { col: 13, row: 16, active: true, timer: 60 },
            { col: 14, row: 17, active: true, timer: 90 },
            { col: 22, row: 16, active: true, timer: 45 },
            { col: 23, row: 17, active: true, timer: 75 }
        ];
    }

    isSolid(worldX, worldY) {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        return this.grid[row][col] === 1;
    }

    checkCircleCollision(x, y, radius) {
        const testPoints = [
            { x: x - radius, y: y },
            { x: x + radius, y: y },
            { x: x, y: y - radius },
            { x: x, y: y + radius },
            { x: x - radius * 0.7, y: y - radius * 0.7 },
            { x: x + radius * 0.7, y: y - radius * 0.7 },
            { x: x - radius * 0.7, y: y + radius * 0.7 },
            { x: x + radius * 0.7, y: y + radius * 0.7 }
        ];
        return testPoints.some(pt => this.isSolid(pt.x, pt.y));
    }

    update() {
        this.causticTimer += 0.02;

        // Emit water spray from leaking pipes
        for (const leak of this.waterLeaks) {
            particles.addWaterJet(leak.x, leak.y, leak.dirX, leak.dirY);
            if (Math.random() < 0.25) {
                particles.addWaterRipple(leak.x + leak.dirX * 18, leak.y + 36, 22);
            }
        }

        // Steam vent hazard cycles
        for (const vent of this.steamVents) {
            vent.timer = (vent.timer + 1) % 180;
            vent.active = (vent.timer >= 90 && vent.timer <= 150);

            if (vent.active && Math.random() < 0.4) {
                const vx = vent.col * this.tileSize + this.tileSize / 2;
                const vy = vent.row * this.tileSize + this.tileSize / 2;
                particles.addSteam(vx, vy, (Math.random() - 0.5) * 1.5, -(1.8 + Math.random()), 14, 38);
            }
        }
    }

    draw(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
        const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));

        // 1. Draw Floor Tiles & Wet Sheens
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = this.grid[r][c];
                const x = c * this.tileSize - camera.x;
                const y = r * this.tileSize - camera.y;

                if (tile === 2) {
                    this.drawRealisticCatwalk(ctx, x, y);
                } else if (tile === 3) {
                    this.drawRealisticVentTile(ctx, x, y);
                } else if (tile === 0) {
                    this.drawRealisticFloor(ctx, x, y, c, r);
                }
            }
        }

        // 2. Draw Floor Water Puddles under leaks
        this.drawFloorPuddles(ctx, camera);

        // 3. Subtle Underwater Caustic Shimmer Layer
        this.drawCaustics(ctx, camera, startCol, endCol, startRow, endRow);

        // 4. Draw Oxygen Recharge Stations
        this.drawOxygenStations(ctx, camera);

        // 5. Draw Solid Walls
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = this.grid[r][c];
                const x = c * this.tileSize - camera.x;
                const y = r * this.tileSize - camera.y;

                if (tile === 1) {
                    this.drawRealisticWall(ctx, x, y, c, r);
                } else if (tile === 5) {
                    this.drawRealisticHatchTile(ctx, x, y);
                }
            }
        }

        // 6. Draw Industrial Copper Steam Piping & Water Leaks
        this.drawRealisticPiping(ctx, camera);
    }

    drawRealisticFloor(ctx, x, y, c, r) {
        const isAlternate = (c + r) % 2 === 0;
        ctx.fillStyle = isAlternate ? '#1a1816' : '#141210';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        ctx.strokeStyle = '#2d2720';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

        ctx.strokeStyle = 'rgba(75, 62, 48, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 10); ctx.lineTo(x + this.tileSize - 10, y + this.tileSize - 10);
        ctx.moveTo(x + this.tileSize - 10, y + 10); ctx.lineTo(x + 10, y + this.tileSize - 10);
        ctx.stroke();

        ctx.fillStyle = '#8a652a';
        [ { dx: 5, dy: 5 }, { dx: this.tileSize - 8, dy: 5 }, { dx: 5, dy: this.tileSize - 8 }, { dx: this.tileSize - 8, dy: this.tileSize - 8 } ].forEach(pt => {
            ctx.beginPath();
            ctx.arc(x + pt.dx, y + pt.dy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawRealisticCatwalk(ctx, x, y) {
        ctx.fillStyle = '#061314';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        const drawn = sprites.draw(ctx, 'catwalk', x, y, this.tileSize, this.tileSize, false, 0.9);
        if (!drawn) {
            ctx.strokeStyle = '#5a462b';
            ctx.lineWidth = 2;
            for (let i = 8; i < this.tileSize; i += 8) {
                ctx.beginPath();
                ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + this.tileSize);
                ctx.moveTo(x, y + i); ctx.lineTo(x + this.tileSize, y + i);
                ctx.stroke();
            }
            ctx.strokeStyle = '#856434';
            ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        }
    }

    drawRealisticVentTile(ctx, x, y) {
        ctx.fillStyle = '#1e1610';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        const ventDrawn = sprites.draw(ctx, 'hazard_vent', x + 5, y + 5, this.tileSize - 10, this.tileSize - 10);
        if (!ventDrawn) {
            ctx.beginPath();
            ctx.arc(x + this.tileSize/2, y + this.tileSize/2, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#0e0b08';
            ctx.fill();
            ctx.strokeStyle = '#d97543';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    drawFloorPuddles(ctx, camera) {
        // Reflective water pools under leaking pipes
        for (const leak of this.waterLeaks) {
            const px = leak.x + leak.dirX * 16 - camera.x;
            const py = leak.y + 36 - camera.y;

            ctx.save();
            ctx.beginPath();
            ctx.ellipse(px, py, 32, 14, 0, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(px, py, 4, px, py, 32);
            grad.addColorStop(0, 'rgba(80, 180, 220, 0.45)');
            grad.addColorStop(0.7, 'rgba(30, 90, 120, 0.25)');
            grad.addColorStop(1, 'rgba(10, 40, 60, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Shiny light reflection streak
            ctx.beginPath();
            ctx.ellipse(px - 4, py - 2, 12, 4, -0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
            ctx.restore();
        }
    }

    drawOxygenStations(ctx, camera) {
        // High-pressure cyan oxygen canister stations
        for (const st of this.oxygenStations) {
            const sx = st.x - camera.x;
            const sy = st.y - camera.y;

            ctx.save();
            // Ambient aura
            ctx.beginPath();
            ctx.arc(sx, sy, 32, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(63, 224, 208, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Twin cyan oxygen cylinders
            ctx.fillStyle = '#0f5c58';
            ctx.fillRect(sx - 14, sy - 18, 11, 28);
            ctx.fillRect(sx + 3, sy - 18, 11, 28);
            ctx.strokeStyle = '#3fe0d0';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(sx - 14, sy - 18, 11, 28);
            ctx.strokeRect(sx + 3, sy - 18, 11, 28);

            // Brass regulator valve on top
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.arc(sx - 8, sy - 20, 4, 0, Math.PI * 2);
            ctx.arc(sx + 9, sy - 20, 4, 0, Math.PI * 2);
            ctx.fill();

            // O2 Glowing Badge
            ctx.fillStyle = '#3fe0d0';
            ctx.shadowColor = '#3fe0d0';
            ctx.shadowBlur = 8;
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('O2', sx, sy + 2);
            ctx.shadowBlur = 0;

            ctx.restore();
        }
    }

    drawRealisticWall(ctx, x, y, c, r) {
        const wallDrawn = sprites.draw(ctx, 'wall', x, y - 10, this.tileSize, this.tileSize + 10);
        if (!wallDrawn) {
            ctx.fillStyle = '#0d0e11';
            ctx.fillRect(x, y, this.tileSize, this.tileSize);

            ctx.fillStyle = '#2a1f15';
            ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

            ctx.strokeStyle = '#6d4f26';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

            if ((c + r) % 3 === 0) {
                ctx.beginPath();
                ctx.arc(x + this.tileSize/2, y + this.tileSize/2, 12, 0, Math.PI * 2);
                ctx.fillStyle = '#081a18';
                ctx.fill();
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y + this.tileSize - 6, this.tileSize, 6);
    }

    drawRealisticHatchTile(ctx, x, y) {
        ctx.fillStyle = '#1c130b';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        ctx.fillStyle = '#4e331a';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

        ctx.beginPath();
        ctx.arc(x + this.tileSize/2, y + this.tileSize/2, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#8a652a';
        ctx.fill();
        ctx.strokeStyle = '#f7e28b';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawRealisticPiping(ctx, camera) {
        const pipeY = 10 * this.tileSize - camera.y - 12;
        const startX = 2 * this.tileSize - camera.x;
        const endX = 29 * this.tileSize - camera.x;

        ctx.save();
        const grad = ctx.createLinearGradient(0, pipeY, 0, pipeY + 14);
        grad.addColorStop(0, '#d97543');
        grad.addColorStop(0.3, '#ff9966');
        grad.addColorStop(0.7, '#8a4120');
        grad.addColorStop(1, '#421e14');

        ctx.fillStyle = grad;
        ctx.fillRect(startX, pipeY, endX - startX, 14);

        ctx.fillStyle = '#d4af37';
        for (let px = startX + 60; px < endX; px += 120) {
            ctx.fillRect(px, pipeY - 2, 6, 18);
        }

        // Draw cracked/spraying joint rings on leaking pipes
        for (const leak of this.waterLeaks) {
            const lx = leak.x - camera.x;
            const ly = leak.y - camera.y;
            ctx.fillStyle = '#3fe0d0';
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawCaustics(ctx, camera, startCol, endCol, startRow, endRow) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#79f2e6';

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.grid[r][c] === 2) {
                    const x = c * this.tileSize - camera.x;
                    const y = r * this.tileSize - camera.y;
                    const wave = Math.sin(this.causticTimer + c * 0.8 + r * 0.5) * 8;
                    ctx.fillRect(x + wave, y, this.tileSize / 2, this.tileSize);
                }
            }
        }
        ctx.restore();
    }
}
