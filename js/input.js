/**
 * Steampunk Game Input System
 * Manages keyboard states, mouse aiming, and single-trigger actions.
 */
class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.mouse = { x: 0, y: 0, isDown: false, clicked: false };

        window.addEventListener('keydown', (e) => {
            // Prevent default scrolling for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
                e.preventDefault();
            }
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.justPressed[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = true;
                this.mouse.clicked = true;
                // Resume audio context on first click
                if (typeof sounds !== 'undefined') {
                    sounds.ensureContext();
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            }
        });
    }

    // Check if key is held down
    isDown(code) {
        return !!this.keys[code];
    }

    // Check if key was pressed this frame only
    isJustPressed(code) {
        if (this.justPressed[code]) {
            this.justPressed[code] = false;
            return true;
        }
        return false;
    }

    // Reset single-frame clicks/triggers
    update() {
        this.mouse.clicked = false;
    }

    // Movement vector helper
    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy -= 1;
        if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy += 1;
        if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx -= 1;
        if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { dx, dy };
    }

    // Check sprint
    isSprinting() {
        return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    }

    // Check sneak
    isSneaking() {
        return this.isDown('ControlLeft') || this.isDown('ControlRight') || this.isDown('KeyC');
    }

    // Check interact
    isInteracting() {
        return this.isJustPressed('KeyE') || this.isJustPressed('Space');
    }

    // Toggle flashlight
    isLanternToggle() {
        return this.isJustPressed('KeyF');
    }

    // Toggle blueprint modal
    isBlueprintToggle() {
        return this.isJustPressed('KeyM') || this.isJustPressed('Tab');
    }
}

const input = new InputHandler();
