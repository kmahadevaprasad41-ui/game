/**
 * Main Game Coordinator & Engine Loop
 * Controls states, rendering passes (world, dynamic lighting, particles, HUD),
 * camera tracking, and interaction logic.
 */
class SteampunkGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lightCanvas = null;
        this.lightCtx = null;

        this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'GAMEOVER', 'VICTORY'
        this.camera = { x: 0, y: 0, width: 1280, height: 720 };

        this.map = null;
        this.player = null;
        this.octopus = null;
        this.crabs = [];
        this.chests = [];
        this.pressureTerminal = null;
        this.escapeHatch = null;
        this.nearbyInteractable = null;

        this.screenShake = 0;
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Create offscreen light canvas for dark underwater station lighting
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialize systems
        sounds.init();
        sonar.init();
        hud.init();
        keyPuzzle.init();

        // Load realistic sprites
        sprites.loadAll(() => {
            console.log('Realistic Steampunk Assets successfully initialized.');
        });

        this.setupEntities();
        this.setupUIEvents();

        // Start animation loop
        requestAnimationFrame(() => this.loop());
    }

    resize() {
        if (!this.canvas) return;
        const container = document.getElementById('game-container');
        const w = container ? container.clientWidth : window.innerWidth;
        const h = container ? container.clientHeight : window.innerHeight;

        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.camera.width = 1280;
        this.camera.height = 720;

        this.lightCanvas.width = 1280;
        this.lightCanvas.height = 720;
    }

    setupEntities() {
        this.map = new GameMap();

        // Spawn Diver Player near receiving chamber
        this.player = new Player(13.5 * 64, 4 * 64);

        // Spawn Dreadnought Steam Octopus Boss
        this.octopus = new SteamOctopus(20 * 64, 14 * 64);

        // Spawn Patrolling Steam Crabs on catwalks
        this.crabs = [
            new SteamCrab(6 * 64, 11 * 64, 'x', 180),
            new SteamCrab(20 * 64, 11 * 64, 'x', 220),
            new SteamCrab(14 * 64, 15 * 64, 'x', 140)
        ];

        // Spawn All 4 Chests with Key Components
        this.chests = [
            new ItemChest(3.5 * 64, 5.5 * 64, 'gear_small', 'Key 1: Small Brass Sprocket', '⚙️', 'KEY 1'),
            new ItemChest(27.5 * 64, 5.5 * 64, 'gear_large', 'Key 2: Heavy Drive Gear', '⚙️', 'KEY 2'),
            new ItemChest(4.5 * 64, 20.5 * 64, 'piston_extender', 'Key 3: Telescoping Piston Stem', '🔧', 'KEY 3'),
            new ItemChest(23.5 * 64, 20.5 * 64, 'gear_handle', 'Key 4: Master Crank Pinion', '🗝️', 'KEY 4')
        ];

        // Pressure Regulation Terminal (South Boiler)
        this.pressureTerminal = new PressureTerminal(14.5 * 64, 20.5 * 64);

        // Main Escape Blast Door Hatch (North Wall)
        this.escapeHatch = new EscapeHatch(13.5 * 64, 1.5 * 64);
    }

    setupUIEvents() {
        // Start Game Button
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                sounds.ensureContext();
                sounds.playGaugeSuccess();
                hud.startTimer();
                this.state = 'PLAYING';
                document.getElementById('title-screen').style.display = 'none';
            });
        }

        // Restart Buttons
        document.querySelectorAll('.btn-restart').forEach(btn => {
            btn.addEventListener('click', () => {
                this.restart();
            });
        });

        // Blueprint viewer button
        const bpBtn = document.getElementById('btn-open-blueprint');
        if (bpBtn) {
            bpBtn.addEventListener('click', () => {
                sounds.playGearClick();
                document.getElementById('blueprint-modal').style.display = 'flex';
            });
        }

        // Blueprint tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                sounds.playGearClick();
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetImg = btn.getAttribute('data-img');
                const imgEl = document.getElementById('blueprint-display-img');
                if (imgEl && targetImg) {
                    imgEl.src = targetImg;
                }
            });
        });

        // Modal close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => {
                sounds.playGearClick();
                const modal = btn.closest('.steampunk-modal');
                if (modal) modal.style.display = 'none';
                if (keyPuzzle.isOpen) keyPuzzle.close();
                if (pressurePuzzle.isOpen) pressurePuzzle.close();
            });
        });

        // Key Puzzle buttons
        const smallGearBtn = document.getElementById('pick-gear-small');
        if (smallGearBtn) {
            smallGearBtn.addEventListener('click', () => keyPuzzle.selectGear('small'));
        }
        const largeGearBtn = document.getElementById('pick-gear-large');
        if (largeGearBtn) {
            largeGearBtn.addEventListener('click', () => keyPuzzle.selectGear('large'));
        }

        // Slot buttons in Key Puzzle
        const keyCanvas = document.getElementById('key-canvas');
        if (keyCanvas) {
            keyCanvas.addEventListener('click', (e) => {
                const rect = keyCanvas.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) * (keyCanvas.width / rect.width);
                const clickY = (e.clientY - rect.top) * (keyCanvas.height / rect.height);
                const centerY = keyCanvas.height / 2;

                const slots = [
                    { x: 40, y: centerY - 45 },
                    { x: 95, y: centerY },
                    { x: 40, y: centerY + 45 }
                ];
                slots.forEach((s, idx) => {
                    if (Math.hypot(clickX - s.x, clickY - s.y) < 28) {
                        keyPuzzle.placeGearInSlot(idx);
                    }
                });
            });
        }

        const engageKeyBtn = document.getElementById('btn-engage-key');
        if (engageKeyBtn) {
            engageKeyBtn.addEventListener('click', () => keyPuzzle.checkAssembly());
        }

        // Pressure Puzzle stabilize button
        const stabilizeBtn = document.getElementById('btn-stabilize-gauge');
        if (stabilizeBtn) {
            stabilizeBtn.addEventListener('click', () => pressurePuzzle.attemptStabilize());
        }
    }

    restart() {
        document.getElementById('gameover-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        hud.countdownSeconds = 300;
        hud.startTimer();
        this.setupEntities();
        this.state = 'PLAYING';
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Skip entity updates if puzzle modal is open
        if (keyPuzzle.isOpen || pressurePuzzle.isOpen) return;

        // Keyboard shortcut to open blueprint
        if (input.isBlueprintToggle()) {
            const bpModal = document.getElementById('blueprint-modal');
            if (bpModal) {
                bpModal.style.display = bpModal.style.display === 'flex' ? 'none' : 'flex';
                sounds.playGearClick();
            }
        }

        // 1. Update Map & Steam Hazard Vents & Water Leaks
        this.map.update();

        // 2. Update Player (Handles movement, O2 drain, flashlight)
        this.player.update(input, this.map, this.camera);

        // Check steam vent hazard damage on player
        for (const vent of this.map.steamVents) {
            if (vent.active) {
                const vx = vent.col * 64 + 32;
                const vy = vent.row * 64 + 32;
                if (Math.hypot(this.player.x - vx, this.player.y - vy) < 34) {
                    this.player.takeDamage(10);
                    sounds.playSteamHiss(0.2, 0.3);
                }
            }
        }

        // 3. Update Steam Octopus Boss
        this.octopus.update(this.player, this.map, particles);

        // Screen shake if Octopus is near and in HUNT mode
        const distToOctopus = Math.hypot(this.octopus.x - this.player.x, this.octopus.y - this.player.y);
        if (this.octopus.state === 'HUNT' && distToOctopus < 300) {
            this.screenShake = 5;
        } else if (this.screenShake > 0) {
            this.screenShake *= 0.85;
        }

        // 4. Update Steam Crabs
        for (const crab of this.crabs) {
            crab.update(this.player, particles);
        }

        // 5. Update Particles, Water Leaks & Acoustics
        particles.update();

        // 6. Update Unified Sonar Radar (Tracks Diver, Octopus, Keys, Hatch, O2)
        sonar.update(this.player, this.octopus, this.chests, this.pressureTerminal, this.escapeHatch, this.map.oxygenStations, particles);

        // 7. Check Interactables
        this.checkInteractables();

        // 8. Update HUD (Timers, O2 bar, Directives)
        hud.update(this.player, this.nearbyInteractable);

        // Handle Player Death, Suffocation, or Station Flooding Timer Expiry
        if (this.player.health <= 0 || hud.countdownSeconds <= 0) {
            this.state = 'GAMEOVER';
            const goTitle = document.querySelector('#gameover-screen h1');
            const goSub = document.querySelector('#gameover-screen p');
            if (hud.countdownSeconds <= 0) {
                if (goTitle) goTitle.innerText = 'STATION FLOODED';
                if (goSub) goSub.innerText = 'Structural bulkheads failed. The facility was completely flooded before escape could be achieved.';
            } else if (this.player.oxygen <= 0) {
                if (goTitle) goTitle.innerText = 'ASPHYXIATION: O2 DEPLETED';
                if (goSub) goSub.innerText = 'The diver ran out of oxygen in the flooded corridors. Always monitor the O2 survival gauge!';
            } else {
                if (goTitle) goTitle.innerText = 'SUIT DEPRESSURIZED';
                if (goSub) goSub.innerText = 'The heavy diving suit collapsed under the brutal force of the station automatons.';
            }
            document.getElementById('gameover-screen').style.display = 'flex';
        }

        // Update Camera
        this.updateCamera();

        // Clear single-frame input
        input.update();
    }

    checkInteractables() {
        this.nearbyInteractable = null;
        const px = this.player.x;
        const py = this.player.y;

        // Check Chests
        for (const chest of this.chests) {
            if (Math.hypot(px - chest.x, py - chest.y) < chest.radius + this.player.radius + 15) {
                this.nearbyInteractable = {
                    type: 'chest',
                    target: chest,
                    prompt: chest.opened ? 'Empty Storage Locker' : `[E] Open Chest (${chest.itemName})`
                };
                if (input.isInteracting() && !chest.opened) {
                    chest.interact(this.player);
                }
                return;
            }
        }

        // Check Pressure Regulation Terminal
        if (Math.hypot(px - this.pressureTerminal.x, py - this.pressureTerminal.y) < 55) {
            this.nearbyInteractable = {
                type: 'pressure',
                prompt: this.player.pressureStabilized 
                    ? 'Pressure Manifold: All Conduits Balanced [STABLE]' 
                    : '[E] Access Pressure Manifold (Timing Puzzle)'
            };
            if (input.isInteracting()) {
                if (!this.player.pressureStabilized) {
                    pressurePuzzle.open(this.player, this.octopus, particles);
                }
            }
            return;
        }

        // Check Oxygen Recharge Stations
        for (const st of this.map.oxygenStations) {
            if (Math.hypot(px - st.x, py - st.y) < st.radius + this.player.radius + 15) {
                this.nearbyInteractable = {
                    type: 'oxygen',
                    prompt: this.player.oxygen >= 98 ? `O2 Reservoir: Full (${st.name})` : `[E] Refill Oxygen Supply (${st.name})`
                };
                if (input.isInteracting()) {
                    this.player.refillOxygen(100);
                }
                return;
            }
        }

        // Check Main Escape Hatch
        if (Math.hypot(px - this.escapeHatch.x, py - this.escapeHatch.y) < 65) {
            const hasAll4 = this.player.hasItem('gear_small') && 
                            this.player.hasItem('gear_large') && 
                            this.player.hasItem('piston_extender') && 
                            this.player.hasItem('gear_handle');

            if (!this.player.keyAssembled) {
                const count = (this.player.hasItem('gear_small') ? 1 : 0) +
                              (this.player.hasItem('gear_large') ? 1 : 0) +
                              (this.player.hasItem('piston_extender') ? 1 : 0) +
                              (this.player.hasItem('gear_handle') ? 1 : 0);

                if (hasAll4) {
                    this.nearbyInteractable = {
                        type: 'hatch_key',
                        prompt: '[E] All 4 Keys Found! Open Key Mechanism & Unlock Hatch'
                    };
                } else {
                    this.nearbyInteractable = {
                        type: 'hatch_key',
                        prompt: `[E] Main Hatch Lock (Needs all 4 Keys: ${count}/4 Found - Check Radar!)`
                    };
                }
                if (input.isInteracting()) {
                    keyPuzzle.open(this.player);
                }
            } else if (!this.player.pressureStabilized) {
                this.nearbyInteractable = {
                    type: 'hatch_pressure',
                    prompt: 'All 4 Keys Unlocked! Warning: Station pressure unbalanced! Balance 4 Gauges at Boiler Junction!'
                };
            } else {
                this.nearbyInteractable = {
                    type: 'hatch_escape',
                    prompt: '[E] Turn Master Gear Crank & Release Escape Airlock [COMPLETE GAME]!'
                };
                if (input.isInteracting()) {
                    this.player.hatchUnlocked = true;
                    sounds.playHatchRelease();
                    particles.addSpark(this.escapeHatch.x, this.escapeHatch.y, 25);
                    setTimeout(() => {
                        this.state = 'VICTORY';
                        document.getElementById('victory-screen').style.display = 'flex';
                    }, 800);
                }
            }
        }
    }

    updateCamera() {
        let targetCamX = this.player.x - this.camera.width / 2;
        let targetCamY = this.player.y - this.camera.height / 2;

        if (this.screenShake > 0.5) {
            targetCamX += (Math.random() * 2 - 1) * this.screenShake;
            targetCamY += (Math.random() * 2 - 1) * this.screenShake;
        }

        this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, targetCamX));
        this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, targetCamY));
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Render Realistic World (Floors, Caustics, Walls, Piping)
        this.map.draw(ctx, this.camera);

        // 2. Render Terminals & Hatch
        this.pressureTerminal.draw(ctx, this.camera, this.player.pressureStabilized);
        this.escapeHatch.draw(ctx, this.camera, this.player.keyAssembled, this.player.pressureStabilized);

        // Render Chests
        for (const chest of this.chests) {
            chest.draw(ctx, this.camera);
        }

        // 3. Render Particles (Acoustic Ripples, Steam Clouds, Leaking Water Sprays & Puddles)
        particles.draw(ctx, this.camera);

        // 4. Render Realistic Steam Crabs
        for (const crab of this.crabs) {
            crab.draw(ctx, this.camera);
        }

        // 5. Render Realistic Dreadnought Steam Octopus Boss
        this.octopus.draw(ctx, this.camera);

        // 6. Render Realistic Heavy Diver Player
        this.player.draw(ctx, this.camera);

        // 7. Dynamic Volumetric Lighting & Atmospheric Fog Pass
        this.drawLightingPass(ctx);

        // 8. Unified Sonar Radar HUD (Human Diver, Octopus, Key Chests, Airlock Hatch, O2)
        sonar.draw(this.player, this.octopus, this.chests, this.pressureTerminal, this.escapeHatch, this.map.oxygenStations, particles);
    }

    drawLightingPass(ctx) {
        const lCtx = this.lightCtx;
        lCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        // Atmospheric underwater darkness (deep navy/slate black)
        lCtx.fillStyle = 'rgba(5, 7, 10, 0.94)';
        lCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        lCtx.globalCompositeOperation = 'destination-out';

        // Volumetric Diver Lantern Beam
        this.player.drawLanternLight(lCtx, this.camera);

        // Red Ocular Searchlights of the Octopus Boss
        this.octopus.drawOcularLights(lCtx, this.camera);

        // Ambient glow from steam hazard vents and terminals
        for (const vent of this.map.steamVents) {
            if (vent.active) {
                const vx = vent.col * 64 + 32 - this.camera.x;
                const vy = vent.row * 64 + 32 - this.camera.y;
                const ventGrad = lCtx.createRadialGradient(vx, vy, 6, vx, vy, 75);
                ventGrad.addColorStop(0, 'rgba(255, 130, 60, 0.85)');
                ventGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                lCtx.beginPath();
                lCtx.arc(vx, vy, 75, 0, Math.PI * 2);
                lCtx.fillStyle = ventGrad;
                lCtx.fill();
            }
        }

        // Pressure Console amber aura
        const termX = this.pressureTerminal.x - this.camera.x;
        const termY = this.pressureTerminal.y - this.camera.y;
        const termGrad = lCtx.createRadialGradient(termX, termY, 6, termX, termY, 80);
        termGrad.addColorStop(0, 'rgba(247, 226, 139, 0.85)');
        termGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.beginPath();
        lCtx.arc(termX, termY, 80, 0, Math.PI * 2);
        lCtx.fillStyle = termGrad;
        lCtx.fill();

        lCtx.globalCompositeOperation = 'source-over';

        // Blit lighting onto main canvas
        ctx.drawImage(this.lightCanvas, 0, 0);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SteampunkGame();
    game.init();
});
