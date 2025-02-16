class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Player properties
        this.playerSize = 30;
        this.playerX = this.width / 2;
        this.playerY = this.height - this.playerSize - 10;
        this.playerSpeed = 5;
        this.playerShapes = ['triangle', 'square', 'circle'];
        this.currentShapeIndex = 0;

        // Power-up states
        this.isInvincible = false;
        this.hasSpeedBoost = false;
        this.hasScoreBoost = false;
        this.powerUpDuration = 5000; // 5 seconds
        this.powerUpTimers = {
            invincibility: 0,
            speedBoost: 0,
            scoreBoost: 0
        };
        this.shapeChangeEffect = 0;
        this.scoreMultiplier = 1;
        this.combo = 0;
        this.maxCombo = 0;

        // Game state
        this.blocks = [];
        this.powerUps = [];
        this.blocksAvoided = 0;
        this.gameOver = false;
        this.startTime = Date.now();
        this.lastBlockSpawn = 0;
        this.spawnInterval = 2000;
        this.initialBlockSpeed = 1.5;

        // Controls
        this.leftPressed = false;
        this.rightPressed = false;
        this.upPressed = false;
        this.downPressed = false;

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        // Setup event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.getElementById('restartButton').addEventListener('click', () => this.restart());

        // Add new properties
        this.particles = [];
        this.comboMilestones = [10, 25, 50, 100];
        this.reachedMilestones = new Set();
        this.activeEffects = new Map(); // Track stacked power-ups

        // Start the game
        this.start();
    }

    start() {
        this.gameOver = false;
        this.blocksAvoided = 0;
        this.blocks = [];
        this.powerUps = [];
        this.startTime = Date.now();
        this.playerX = this.width / 2;
        this.playerY = this.height - this.playerSize - 10;
        this.isInvincible = false;
        this.hasSpeedBoost = false;
        this.hasScoreBoost = false;
        this.scoreMultiplier = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.reachedMilestones.clear();
        this.updateScore();
        this.updatePowerUpStatus();
        document.querySelector('.overlay').classList.remove('active');
        requestAnimationFrame(this.gameLoop);
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowLeft') this.leftPressed = true;
        if (e.key === 'ArrowRight') this.rightPressed = true;
        if (e.key === 'ArrowUp') this.upPressed = true;
        if (e.key === 'ArrowDown') this.downPressed = true;
        if (e.key === ' ') this.cycleShape();
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowLeft') this.leftPressed = false;
        if (e.key === 'ArrowRight') this.rightPressed = false;
        if (e.key === 'ArrowUp') this.upPressed = false;
        if (e.key === 'ArrowDown') this.downPressed = false;
    }

    cycleShape() {
        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.playerShapes.length;
        this.shapeChangeEffect = 1;
        // Add particle effect for shape change
        this.createParticles(this.playerX, this.playerY, this.playerShapes[this.currentShapeIndex]);
        document.getElementById('currentShape').textContent = this.playerShapes[this.currentShapeIndex];
    }

    getDifficulty() {
        return 1 + Math.min(3, this.blocksAvoided / 20);
    }

    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.playerX, this.playerY);

        if (this.shapeChangeEffect > 0) {
            this.ctx.rotate(this.shapeChangeEffect * Math.PI);
            this.shapeChangeEffect = Math.max(0, this.shapeChangeEffect - 0.1);
        }

        // Player color based on active power-ups
        if (this.isInvincible) {
            this.ctx.fillStyle = `hsl(${Date.now() % 360}, 80%, 60%)`; // Rainbow effect
        } else if (this.hasSpeedBoost) {
            this.ctx.fillStyle = '#00ff00'; // Green for speed boost
        } else if (this.hasScoreBoost) {
            this.ctx.fillStyle = '#ffd700'; // Gold for score boost
        } else {
            this.ctx.fillStyle = '#0d6efd'; // Default blue
        }

        switch (this.playerShapes[this.currentShapeIndex]) {
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -this.playerSize / 2);
                this.ctx.lineTo(-this.playerSize / 2, this.playerSize / 2);
                this.ctx.lineTo(this.playerSize / 2, this.playerSize / 2);
                this.ctx.closePath();
                break;
            case 'square':
                this.ctx.beginPath();
                this.ctx.rect(-this.playerSize / 2, -this.playerSize / 2, this.playerSize, this.playerSize);
                break;
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, this.playerSize / 2, 0, Math.PI * 2);
                break;
        }
        this.ctx.fill();

        // Draw power-up effects
        if (this.isInvincible || this.hasSpeedBoost || this.hasScoreBoost) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.arc(0, 0, this.playerSize * 0.8, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    updatePowerUpStatus() {
        const powerUpStatuses = document.getElementById('powerUpStatuses');
        powerUpStatuses.innerHTML = '';

        if (this.isInvincible) {
            const timeLeft = Math.ceil((this.powerUpDuration - (Date.now() - this.powerUpTimers.invincibility)) / 1000);
            powerUpStatuses.innerHTML += `<div class="power-up-status invincible">Shield: ${timeLeft}s</div>`;
        }
        if (this.hasSpeedBoost) {
            const timeLeft = Math.ceil((this.powerUpDuration - (Date.now() - this.powerUpTimers.speedBoost)) / 1000);
            powerUpStatuses.innerHTML += `<div class="power-up-status speed">Speed: ${timeLeft}s</div>`;
        }
        if (this.hasScoreBoost) {
            const timeLeft = Math.ceil((this.powerUpDuration - (Date.now() - this.powerUpTimers.scoreBoost)) / 1000);
            powerUpStatuses.innerHTML += `<div class="power-up-status score">2x Score: ${timeLeft}s</div>`;
        }
    }

    spawnBlock() {
        const blockWidth = 30 + Math.random() * 50;
        const difficulty = this.getDifficulty();
        const speed = this.initialBlockSpeed * difficulty;

        // Different block types
        const blockTypes = ['normal', 'fast', 'large', 'small'];
        const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];

        let finalWidth = blockWidth;
        let finalSpeed = speed;
        let hue = Math.min(0, 360 - speed * 30);

        switch (blockType) {
            case 'fast':
                finalSpeed *= 1.5;
                hue = 0; // Red for fast blocks
                break;
            case 'large':
                finalWidth *= 1.5;
                hue = 240; // Blue for large blocks
                break;
            case 'small':
                finalWidth *= 0.7;
                finalSpeed *= 1.2;
                hue = 120; // Green for small blocks
                break;
        }

        const block = {
            x: Math.random() * (this.width - finalWidth),
            y: -20,
            width: finalWidth,
            height: 20,
            speed: finalSpeed,
            type: blockType,
            color: `hsl(${hue}, 70%, 50%)`,
            passed: false
        };
        this.blocks.push(block);

        // Spawn power-up with increasing chance based on combo
        if (Math.random() < 0.1 + (this.combo * 0.02)) {
            this.spawnPowerUp();
        }
    }

    spawnPowerUp() {
        const types = ['invincibility', 'speedBoost', 'scoreBoost'];
        const type = types[Math.floor(Math.random() * types.length)];

        const powerUp = {
            x: Math.random() * (this.width - 20),
            y: -20,
            size: 20,
            speed: this.initialBlockSpeed,
            type: type
        };
        this.powerUps.push(powerUp);
    }

    updateScore() {
        let finalScore = this.blocksAvoided * this.scoreMultiplier;
        if (this.hasScoreBoost) finalScore *= 2;

        document.getElementById('currentScore').textContent = Math.floor(finalScore);
        document.getElementById('finalScore').textContent = Math.floor(finalScore);
        document.getElementById('multiplier').textContent = `x${(this.scoreMultiplier * (this.hasScoreBoost ? 2 : 1)).toFixed(1)}`;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('maxCombo').textContent = this.maxCombo;
    }

    checkCollision(block) {
        if (this.isInvincible) return false;

        const playerRadius = this.playerSize / 2;
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;

        const dx = this.playerX - blockCenterX;
        const dy = this.playerY - blockCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check for near-miss
        if (distance < playerRadius + Math.min(block.width, block.height) * 1.5) {
            this.scoreMultiplier = Math.min(3, this.scoreMultiplier + 0.1);
        }

        const collision = distance < playerRadius + Math.min(block.width, block.height) / 2;
        if (collision) {
            // Reset combo on collision
            this.combo = 0;
            this.reachedMilestones.clear();
            // Create destruction particles
            this.createParticles(blockCenterX, blockCenterY, 'block');
        }
        return collision;
    }

    checkPowerUpCollision(powerUp) {
        const playerRadius = this.playerSize / 2;
        const dx = this.playerX - (powerUp.x + powerUp.size / 2);
        const dy = this.playerY - (powerUp.y + powerUp.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < playerRadius + powerUp.size / 2;
    }

    createParticles(x, y, shape) {
        const colors = ['#ffd700', '#00ff00', '#ff00ff'];
        for (let i = 0; i < 10; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0
            };
            this.particles.push(particle);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.95;

            // Draw particle
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }


    gameLoop(timestamp) {
        if (this.gameOver) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Update player position with speed boost
        const currentSpeed = this.hasSpeedBoost ? this.playerSpeed * 1.5 : this.playerSpeed;

        if (this.leftPressed && this.playerX > this.playerSize / 2) {
            this.playerX -= currentSpeed;
        }
        if (this.rightPressed && this.playerX < this.width - this.playerSize / 2) {
            this.playerX += currentSpeed;
        }
        if (this.upPressed && this.playerY > this.playerSize / 2) {
            this.playerY -= currentSpeed;
        }
        if (this.downPressed && this.playerY < this.height - this.playerSize / 2) {
            this.playerY += currentSpeed;
        }

        // Update power-up timers
        const now = Date.now();
        if (this.isInvincible && now - this.powerUpTimers.invincibility > this.powerUpDuration) {
            this.isInvincible = false;
        }
        if (this.hasSpeedBoost && now - this.powerUpTimers.speedBoost > this.powerUpDuration) {
            this.hasSpeedBoost = false;
        }
        if (this.hasScoreBoost && now - this.powerUpTimers.scoreBoost > this.powerUpDuration) {
            this.hasScoreBoost = false;
        }

        const difficulty = this.getDifficulty();
        this.spawnInterval = Math.max(500, 2000 - (difficulty - 1) * 500);

        if (timestamp - this.lastBlockSpawn > this.spawnInterval) {
            this.spawnBlock();
            this.lastBlockSpawn = timestamp;
        }

        // Update and draw power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;

            // Draw power-up with different colors based on type
            let powerUpColor;
            switch (powerUp.type) {
                case 'invincibility':
                    powerUpColor = '#ffd700'; // Gold
                    break;
                case 'speedBoost':
                    powerUpColor = '#00ff00'; // Green
                    break;
                case 'scoreBoost':
                    powerUpColor = '#ff00ff'; // Magenta
                    break;
            }

            this.ctx.fillStyle = powerUpColor;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2,
                powerUp.size / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw power-up icon
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icon = powerUp.type === 'invincibility' ? '🛡️' :
                powerUp.type === 'speedBoost' ? '⚡' : '2x';
            this.ctx.fillText(icon, powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2);

            if (this.checkPowerUpCollision(powerUp)) {
                switch (powerUp.type) {
                    case 'invincibility':
                        this.isInvincible = true;
                        this.powerUpTimers.invincibility = now;
                        break;
                    case 'speedBoost':
                        this.hasSpeedBoost = true;
                        this.powerUpTimers.speedBoost = now;
                        break;
                    case 'scoreBoost':
                        this.hasScoreBoost = true;
                        this.powerUpTimers.scoreBoost = now;
                        break;
                }
                this.powerUps.splice(i, 1);
                continue;
            }

            if (powerUp.y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }

        // Update and draw particles
        this.updateParticles();

        // Update and draw blocks
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            block.y += block.speed;

            // Draw block with type-specific effects
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(block.x, block.y, block.width, block.height);

            // Add visual effects for different block types
            if (block.type === 'fast') {
                this.ctx.strokeStyle = '#fff';
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeRect(block.x, block.y, block.width, block.height);
                this.ctx.setLineDash([]);
            }

            if (this.checkCollision(block)) {
                this.gameOver = true;
                this.maxCombo = Math.max(this.maxCombo, this.combo);
                document.querySelector('.overlay').classList.add('active');
                return;
            }

            // Count dodged blocks and update combo
            if (!block.passed && block.y > this.playerY + this.playerSize) {
                block.passed = true;
                this.blocksAvoided++;
                this.combo++;
                this.maxCombo = Math.max(this.maxCombo, this.combo);

                // Check for combo milestones
                for (const milestone of this.comboMilestones) {
                    if (this.combo >= milestone && !this.reachedMilestones.has(milestone)) {
                        this.reachedMilestones.add(milestone);
                        // Reward power-up for reaching milestone
                        this.spawnPowerUp();
                        // Create celebration particles
                        this.createParticles(this.playerX, this.playerY - 30, 'milestone');
                    }
                }
            }

            if (block.y > this.height) {
                this.blocks.splice(i, 1);
            }
        }

        // Gradually decrease multiplier
        this.scoreMultiplier = Math.max(1, this.scoreMultiplier - 0.01);

        this.drawPlayer();
        this.updateScore();
        this.updatePowerUpStatus();

        requestAnimationFrame(this.gameLoop);
    }

    restart() {
        this.start();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});