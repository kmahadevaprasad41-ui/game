/**
 * Steampunk HUD Overlay & User Interface
 * Manages Hull Integrity, Steam Power, Oxygen (O2) Survival Gauge,
 * Station Flooding Countdown Timer, Noise pips, Inventory items, and Directives.
 */
class GameHUD {
    constructor() {
        this.healthBar = null;
        this.steamBar = null;
        this.oxygenBar = null;
        this.oxygenText = null;
        this.timerText = null;
        this.noisePips = [];
        this.promptEl = null;
        this.invSlots = [];

        // Escape Flooding Countdown: 5 minutes = 300 seconds
        this.countdownSeconds = 300;
        this.lastSecondTime = Date.now();
        this.timerActive = false;
    }

    init() {
        this.healthBar = document.getElementById('health-bar');
        this.steamBar = document.getElementById('steam-bar');
        this.oxygenBar = document.getElementById('oxygen-bar');
        this.oxygenText = document.getElementById('oxygen-text');
        this.timerText = document.getElementById('countdown-display');
        this.promptEl = document.getElementById('interaction-prompt');

        this.noisePips = [
            document.getElementById('pip-1'),
            document.getElementById('pip-2'),
            document.getElementById('pip-3')
        ];

        this.invSlots = [
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3'),
            document.getElementById('slot-4')
        ];
    }

    startTimer() {
        this.timerActive = true;
        this.lastSecondTime = Date.now();
    }

    update(player, nearbyInteractable) {
        // 1. Countdown Timer (Station Flooding / Depressurization)
        if (this.timerActive && this.countdownSeconds > 0) {
            const now = Date.now();
            if (now - this.lastSecondTime >= 1000) {
                this.countdownSeconds--;
                this.lastSecondTime = now;
                if (this.countdownSeconds <= 60 && this.countdownSeconds % 2 === 0) {
                    sounds.playTimerTick();
                }
            }
        }

        if (this.timerText) {
            const mins = Math.floor(this.countdownSeconds / 60);
            const secs = this.countdownSeconds % 60;
            const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            this.timerText.innerText = formatted;

            if (this.countdownSeconds <= 60) {
                this.timerText.style.color = '#ff3838';
                this.timerText.style.textShadow = '0 0 10px #ff3838';
            } else {
                this.timerText.style.color = '#f7e28b';
            }
        }

        // 2. Health & Steam Bars
        if (this.healthBar) {
            const hpPercent = (player.health / player.maxHealth) * 100;
            this.healthBar.style.width = `${hpPercent}%`;
        }

        if (this.steamBar) {
            const steamPercent = (player.steam / player.maxSteam) * 100;
            this.steamBar.style.width = `${steamPercent}%`;
        }

        // 3. Oxygen (O2) Survival Meter
        if (this.oxygenBar) {
            const o2Percent = (player.oxygen / player.maxOxygen) * 100;
            this.oxygenBar.style.width = `${o2Percent}%`;

            if (o2Percent <= 20) {
                this.oxygenBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
            } else {
                this.oxygenBar.style.background = 'linear-gradient(90deg, #0e5b55, #16a085, #3fe0d0)';
            }
        }

        if (this.oxygenText) {
            const o2Val = Math.round(player.oxygen);
            this.oxygenText.innerText = o2Val <= 20 ? `O2: ${o2Val}% (CRITICAL!)` : `O2: ${o2Val}%`;
            this.oxygenText.style.color = o2Val <= 20 ? '#ff4d4d' : '#3fe0d0';
        }

        // 4. Acoustic Noise Signature Meter Pips
        if (this.noisePips.length === 3) {
            this.noisePips.forEach(p => { if (p) p.className = 'noise-pip'; });

            if (player.currentMode === 'sneak' || player.noiseLevel <= 0.05) {
                if (this.noisePips[0]) this.noisePips[0].className = 'noise-pip active-green';
            } else if (player.currentMode === 'walk') {
                if (this.noisePips[0]) this.noisePips[0].className = 'noise-pip active-yellow';
                if (this.noisePips[1]) this.noisePips[1].className = 'noise-pip active-yellow';
            } else if (player.currentMode === 'sprint') {
                if (this.noisePips[0]) this.noisePips[0].className = 'noise-pip active-red';
                if (this.noisePips[1]) this.noisePips[1].className = 'noise-pip active-red';
                if (this.noisePips[2]) this.noisePips[2].className = 'noise-pip active-red';
            }
        }

        // 5. Inventory Slots Display (All 4 Key Components)
        const items = [
            { id: 'gear_small', name: 'Key 1: Sprocket', icon: '⚙️' },
            { id: 'gear_large', name: 'Key 2: Drive Gear', icon: '⚙️' },
            { id: 'piston_extender', name: 'Key 3: Piston Stem', icon: '🔧' },
            { id: 'gear_handle', name: 'Key 4: Crank Pinion', icon: '🗝️' }
        ];

        items.forEach((it, idx) => {
            const slot = this.invSlots[idx];
            if (!slot) return;
            const has = player.hasItem(it.id);
            if (has) {
                slot.className = 'inv-slot occupied';
                slot.innerHTML = `<span class="inv-icon">${it.icon}</span><span class="inv-name">${it.name}</span>`;
            } else {
                slot.className = 'inv-slot';
                slot.innerHTML = `<span class="inv-name" style="opacity:0.35;">Empty</span>`;
            }
        });

        // 6. Objective Tracker (All 4 Keys)
        const partsCount = (player.hasItem('gear_small') ? 1 : 0) +
                           (player.hasItem('gear_large') ? 1 : 0) +
                           (player.hasItem('piston_extender') ? 1 : 0) +
                           (player.hasItem('gear_handle') ? 1 : 0);

        const objParts = document.getElementById('obj-parts');
        const objKey = document.getElementById('obj-key');
        const objPressure = document.getElementById('obj-pressure');
        const objHatch = document.getElementById('obj-hatch');

        if (objParts) {
            objParts.innerHTML = `<span class="objective-check">[${partsCount === 4 ? '✓' : ' '}]</span> Find All 4 Keys (${partsCount}/4)`;
            if (partsCount === 4) objParts.classList.add('done');
        }
        if (objKey) {
            objKey.innerHTML = `<span class="objective-check">[${player.keyAssembled ? '✓' : ' '}]</span> Assemble Gear Crank Key`;
            if (player.keyAssembled) objKey.classList.add('done');
        }
        if (objPressure) {
            objPressure.innerHTML = `<span class="objective-check">[${player.pressureStabilized ? '✓' : ' '}]</span> Balance Pressure Gauges A-D`;
            if (player.pressureStabilized) objPressure.classList.add('done');
        }
        if (objHatch) {
            objHatch.innerHTML = `<span class="objective-check">[${player.hatchUnlocked ? '✓' : ' '}]</span> Escape through Main Hatch!`;
            if (player.hatchUnlocked) objHatch.classList.add('done');
        }

        // 7. Interaction Prompt Banner
        if (this.promptEl) {
            if (nearbyInteractable) {
                this.promptEl.innerText = nearbyInteractable.prompt;
                this.promptEl.style.display = 'block';
            } else {
                this.promptEl.style.display = 'none';
            }
        }
    }
}

const hud = new GameHUD();
