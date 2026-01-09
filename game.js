// Game Configuration
const CONFIG = {
    gravity: 0.5,
    jumpForce: -12,
    moveSpeed: 5,
    climbSpeed: 4,
    energyDrainRate: 0.02, // per frame (about 1 per second at 60fps)
    initialRobots: 4,
    initialEnergy: 100,
    levels: 22,
    levelNames: [
        "Basic Circuits", "Current Flow", "Resistance Training", "Voltage Valley",
        "Parallel Paths", "Series Circuits", "Ohm's Outpost", "Power Plant",
        "Capacitor Cavern", "Transformer Tower", "Magnetic Maze", "Inductor Island",
        "Circuit Breaker", "Generator Gorge", "Transistor Trail", "Diode Dungeon",
        "Resistor Ridge", "Capacitor Cliff", "Transformer Trail", "Generator Gulch",
        "Final Circuit", "The Power Core"
    ]
};

// Game State
class GameState {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.robots = CONFIG.initialRobots;
        this.energy = CONFIG.initialEnergy;
        this.gameRunning = false;
        this.gameOver = false;
        this.levelComplete = false;
        this.paused = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.rings = 0;
        this.bombs = 0;
        this.soundEnabled = true;
        this.currentQuestion = null;
        this.questionAnswered = false;
        this.selectedOption = null;
        this.joystickActive = false;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
    }

    resetForNewLevel() {
        this.energy = CONFIG.initialEnergy;
        this.levelComplete = false;
        this.questionAnswered = false;
        this.selectedOption = null;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
    }

    updateStats(correct) {
        this.questionsAnswered++;
        if (correct) this.correctAnswers++;
    }

    getAccuracy() {
        return this.questionsAnswered > 0 
            ? Math.round((this.correctAnswers / this.questionsAnswered) * 100) 
            : 0;
    }
}

// Input Handler
class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            space: false
        };

        this.initKeyboard();
        this.initMobile();
    }

    initKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    this.keys.left = true;
                    break;
                case 'arrowright':
                case 'd':
                    this.keys.right = true;
                    break;
                case 'arrowup':
                case 'w':
                    this.keys.up = true;
                    break;
                case 'arrowdown':
                case 's':
                    this.keys.down = true;
                    break;
                case ' ':
                    this.keys.jump = true;
                    this.keys.space = true;
                    e.preventDefault();
                    break;
                case 'p':
                    game.togglePause();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    this.keys.left = false;
                    break;
                case 'arrowright':
                case 'd':
                    this.keys.right = false;
                    break;
                case 'arrowup':
                case 'w':
                    this.keys.up = false;
                    break;
                case 'arrowdown':
                case 's':
                    this.keys.down = false;
                    break;
                case ' ':
                    this.keys.jump = false;
                    this.keys.space = false;
                    break;
            }
        });
    }

    initMobile() {
        const mobileJump = document.getElementById('mobile-jump');
        const mobileUp = document.getElementById('mobile-up');
        const mobileDown = document.getElementById('mobile-down');
        const mobileLeft = document.getElementById('mobile-left');
        const mobileRight = document.getElementById('mobile-right');

        const addTouchListeners = (element, key) => {
            element.addEventListener('touchstart', (e) => {
                this.keys[key] = true;
                e.preventDefault();
            });
            element.addEventListener('touchend', () => {
                this.keys[key] = false;
            });
            element.addEventListener('touchcancel', () => {
                this.keys[key] = false;
            });
        };

        addTouchListeners(mobileJump, 'jump');
        addTouchListeners(mobileLeft, 'left');
        addTouchListeners(mobileRight, 'right');
        addTouchListeners(mobileUp, 'up');
        addTouchListeners(mobileDown, 'down');
    }

    reset() {
        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }
}

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.climbing = false;
        this.facingRight = true;
    }

    update(input, platforms, ladders) {
        // Apply gravity if not climbing
        if (!this.climbing) {
            this.velocityY += CONFIG.gravity;
        }

        // Handle horizontal movement
        this.velocityX = 0;
        if (input.keys.left) {
            this.velocityX = -CONFIG.moveSpeed;
            this.facingRight = false;
        }
        if (input.keys.right) {
            this.velocityX = CONFIG.moveSpeed;
            this.facingRight = true;
        }

        // Handle jumping
        if (input.keys.jump && this.onGround) {
            this.velocityY = CONFIG.jumpForce;
            game.playSound('jump');
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Boundary checking
        this.x = Math.max(0, Math.min(game.canvas.width - this.width, this.x));

        // Check if on ladder
        this.climbing = false;
        for (const ladder of ladders) {
            if (this.isColliding(ladder)) {
                this.climbing = true;
                if (input.keys.up) this.y -= CONFIG.climbSpeed;
                if (input.keys.down && this.y < game.canvas.height - this.height) {
                    this.y += CONFIG.climbSpeed;
                }
                break;
            }
        }

        // Platform collision
        this.onGround = false;
        for (const platform of platforms) {
            if (this.isColliding(platform)) {
                this.handleCollision(platform);
            }
        }
    }

    isColliding(object) {
        return this.x < object.x + object.width &&
               this.x + this.width > object.x &&
               this.y < object.y + object.height &&
               this.y + this.height > object.y;
    }

    handleCollision(platform) {
        // Top collision
        if (this.velocityY > 0 && 
            this.y + this.height - this.velocityY <= platform.y) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
        // Bottom collision
        else if (this.velocityY < 0 &&
                 this.y - this.velocityY >= platform.y + platform.height) {
            this.y = platform.y + platform.height;
            this.velocityY = 0;
        }
        // Side collision
        else {
            if (this.velocityX > 0) {
                this.x = platform.x - this.width;
            } else if (this.velocityX < 0) {
                this.x = platform.x + platform.width;
            }
            this.velocityX = 0;
        }
    }

    draw(ctx) {
        // Robot body
        ctx.fillStyle = game.state.invulnerable ? '#00aaff' : '#4fc3ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Robot head
        ctx.fillStyle = '#2a8cd0';
        ctx.fillRect(this.x + this.width/4, this.y - 15, this.width/2, 20);

        // Eyes
        ctx.fillStyle = '#00ff00';
        const eyeX = this.facingRight ? this.x + this.width * 0.7 : this.x + this.width * 0.3;
        ctx.beginPath();
        ctx.arc(eyeX, this.y + this.height/3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (game.state.invulnerable) {
            ctx.arc(this.x + this.width/2, this.y + this.height * 0.7, 8, 0, Math.PI);
        } else {
            ctx.moveTo(this.x + this.width/3, this.y + this.height * 0.7);
            ctx.lineTo(this.x + this.width * 2/3, this.y + this.height * 0.7);
        }
        ctx.stroke();

        // Invulnerability effect
        if (game.state.invulnerable) {
            const time = Date.now() / 100;
            const pulse = Math.sin(time) * 5 + 10;
            
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width/2 + pulse, 0, Math.PI * 2
            );
            ctx.stroke();
        }
    }
}

// Main Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.input = new InputHandler();
        
        // Game objects
        this.player = null;
        this.platforms = [];
        this.powerPills = [];
        this.rings = [];
        this.fireballs = [];
        this.bombs = [];
        this.magnets = [];
        this.doors = [];
        this.ladders = [];
        
        // DOM Elements
        this.domElements = this.cacheDomElements();
        
        // Initialize
        this.init();
        this.setupEventListeners();
        this.setupJoystick();
        
        // Start game loop
        this.gameLoop();
    }

    cacheDomElements() {
        return {
            robotCount: document.getElementById('robot-count'),
            energyValue: document.getElementById('energy-value'),
            energyFill: document.getElementById('energy-fill'),
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            levelName: document.getElementById('level-name'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            submitAnswerBtn: document.getElementById('submit-answer'),
            ringCount: document.getElementById('ring-count'),
            invTime: document.getElementById('inv-time'),
            bombCount: document.getElementById('bomb-count'),
            soundToggle: document.getElementById('sound-toggle'),
            soundIcon: document.getElementById('sound-icon'),
            startMessage: document.getElementById('start-message'),
            startButton: document.getElementById('start-button'),
            levelCompleteMessage: document.getElementById('level-complete-message'),
            levelCompleteText: document.getElementById('level-complete-text'),
            nextLevelButton: document.getElementById('next-level-button'),
            gameOverMessage: document.getElementById('game-over-message'),
            gameOverText: document.getElementById('game-over-text'),
            restartButton: document.getElementById('restart-button'),
            pauseMessage: document.getElementById('pause-message'),
            resumeButton: document.getElementById('resume-button'),
            instructionsPanel: document.getElementById('instructions-panel'),
            hideInstructions: document.getElementById('hide-instructions'),
            showInstructionsBtn: document.getElementById('show-instructions-btn'),
            viewControls: document.getElementById('view-controls')
        };
    }

    init() {
        // Set canvas size
        this.resizeCanvas();
        
        // Show start message
        this.showStartMessage();
        
        // Load first level
        this.loadLevel(1);
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    showStartMessage() {
        this.domElements.startMessage.style.display = 'block';
        this.domElements.levelCompleteMessage.style.display = 'none';
        this.domElements.gameOverMessage.style.display = 'none';
        this.domElements.pauseMessage.style.display = 'none';
    }

    loadLevel(level) {
        // Clear existing objects
        this.platforms = [];
        this.powerPills = [];
        this.rings = [];
        this.fireballs = [];
        this.bombs = [];
        this.magnets = [];
        this.doors = [];
        this.ladders = [];

        // Create level
        this.createLevel(level);

        // Create player
        this.player = new Player(100, this.canvas.height - 150);

        // Update UI
        this.updateLevelDisplay(level);
        
        // Load question for door
        this.loadQuestion();

        // Reset game state for level
        this.state.resetForNewLevel();
        this.updateUI();
    }

    createLevel(level) {
        const baseY = this.canvas.height - 100;
        
        // Ground platform
        this.platforms.push({ x: 0, y: baseY, width: this.canvas.width, height: 20 });

        // Level-specific platforms
        if (level === 1) {
            // Simple level for beginners
            this.platforms.push({ x: 200, y: baseY - 150, width: 200, height: 20 });
            this.platforms.push({ x: 500, y: baseY - 250, width: 200, height: 20 });
            this.ladders.push({ x: 300, y: baseY - 150, width: 20, height: 150 });
        } else {
            // Procedural generation for higher levels
            const platformCount = 5 + Math.min(level, 10);
            for (let i = 0; i < platformCount; i++) {
                const x = 100 + i * (this.canvas.width - 200) / platformCount;
                const y = baseY - 50 - (i % 4) * 80;
                const width = 80 + Math.random() * 100;
                this.platforms.push({ x, y, width, height: 20 });

                // Add ladders occasionally
                if (i % 3 === 0 && i > 0) {
                    this.ladders.push({ 
                        x: x + width/2 - 10, 
                        y: y, 
                        width: 20, 
                        height: 100 
                    });
                }
            }
        }

        // Create collectibles
        this.createCollectibles(level);
        
        // Create door
        this.doors.push({
            x: this.canvas.width - 150,
            y: 100,
            width: 60,
            height: 100,
            locked: true
        });
    }

    createCollectibles(level) {
        // Power pills
        const pillCount = 15 + level * 2;
        for (let i = 0; i < pillCount; i++) {
            const platform = this.platforms[i % this.platforms.length];
            this.powerPills.push({
                x: platform.x + 20 + Math.random() * (platform.width - 40),
                y: platform.y - 15,
                radius: 8,
                collected: false
            });
        }

        // Rings
        const ringCount = 3 + Math.floor(level / 4);
        for (let i = 0; i < ringCount; i++) {
            const platform = this.platforms[Math.min(i + 2, this.platforms.length - 1)];
            this.rings.push({
                x: platform.x + platform.width/2,
                y: platform.y - 30,
                radius: 15,
                collected: false,
                pulse: 0
            });
        }

        // Fireballs
        const fireballCount = 2 + Math.floor(level / 3);
        for (let i = 0; i < fireballCount; i++) {
            const platform = this.platforms[i % this.platforms.length];
            this.fireballs.push({
                x: platform.x + 30,
                y: platform.y - 20,
                radius: 15,
                speed: 1 + Math.random() * 2,
                direction: Math.random() > 0.5 ? 1 : -1,
                minX: platform.x + 20,
                maxX: platform.x + platform.width - 20
            });
        }

        // Bombs (level 8+)
        if (level >= 8) {
            for (let i = 0; i < Math.min(3, this.platforms.length - 2); i++) {
                const platform = this.platforms[i + 2];
                this.bombs.push({
                    x: platform.x + platform.width/2,
                    y: platform.y - 15,
                    radius: 12,
                    active: true,
                    fuse: 300 + Math.random() * 300
                });
            }
        }

        // Magnets (level 12+)
        if (level >= 12) {
            for (let i = 0; i < 2; i++) {
                this.magnets.push({
                    x: 200 + i * 400,
                    y: 200,
                    radius: 25,
                    strength: 0.5,
                    active: true
                });
            }
        }
    }

    updateLevelDisplay(level) {
        this.domElements.level.textContent = level;
        this.domElements.levelName.textContent = CONFIG.levelNames[level - 1] || `Circuit Level ${level}`;
    }

    loadQuestion() {
        this.state.currentQuestion = getRandomQuestion(this.state.currentLevel);
        this.domElements.questionText.textContent = this.state.currentQuestion.question;
        
        // Clear options
        this.domElements.optionsContainer.innerHTML = '';
        
        // Add options
        this.state.currentQuestion.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option';
            optionEl.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            optionEl.dataset.index = index;
            
            optionEl.addEventListener('click', () => {
                if (!this.state.questionAnswered) {
                    document.querySelectorAll('.option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    optionEl.classList.add('selected');
                    this.state.selectedOption = index;
                }
            });
            
            this.domElements.optionsContainer.appendChild(optionEl);
        });
        
        this.state.questionAnswered = false;
        this.state.selectedOption = null;
        this.domElements.submitAnswerBtn.disabled = false;
    }

    updateUI() {
        this.domElements.robotCount.textContent = this.state.robots;
        this.domElements.energyValue.textContent = Math.floor(this.state.energy);
        this.domElements.energyFill.style.width = `${this.state.energy}%`;
        this.domElements.score.textContent = this.state.score;
        this.domElements.ringCount.textContent = this.state.rings;
        this.domElements.invTime.textContent = `${Math.floor(this.state.invulnerabilityTime/60)}s`;
        this.domElements.bombCount.textContent = this.state.bombs;
        
        // Update power-up displays
        document.querySelector('.power-up.invulnerable').classList.toggle('active', this.state.invulnerable);
    }

    gameLoop() {
        if (!this.state.gameRunning || this.state.paused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update game state
        this.update();

        // Draw everything
        this.draw();

        // Check game conditions
        this.checkGameConditions();

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update player
        this.player.update(this.input, this.platforms, this.ladders);

        // Update collectibles
        this.updateCollectibles();

        // Update enemies
        this.updateEnemies();

        // Update power-ups
        this.updatePowerUps();

        // Check door collision
        this.checkDoorCollision();

        // Drain energy
        this.state.energy -= CONFIG.energyDrainRate;
        if (this.state.energy <= 0) {
            this.state.energy = 0;
            this.loseRobot();
        }
    }

    updateCollectibles() {
        // Power pills
        this.powerPills.forEach(pill => {
            if (!pill.collected && this.player.isColliding({
                x: pill.x - pill.radius,
                y: pill.y - pill.radius,
                width: pill.radius * 2,
                height: pill.radius * 2
            })) {
                pill.collected = true;
                this.state.score += 10;
                this.playSound('collect');
            }
        });

        // Rings
        this.rings.forEach(ring => {
            if (!ring.collected) {
                ring.pulse = (ring.pulse + 0.1) % (Math.PI * 2);
                if (this.player.isColliding({
                    x: ring.x - ring.radius,
                    y: ring.y - ring.radius,
                    width: ring.radius * 2,
                    height: ring.radius * 2
                })) {
                    ring.collected = true;
                    this.state.rings++;
                    this.state.score += 100;
                    this.state.invulnerable = true;
                    this.state.invulnerabilityTime = 600; // 10 seconds at 60fps
                    this.playSound('ring');
                }
            }
        });
    }

    updateEnemies() {
        // Fireballs
        this.fireballs.forEach(fireball => {
            fireball.x += fireball.speed * fireball.direction;
            
            if (fireball.x <= fireball.minX || fireball.x >= fireball.maxX) {
                fireball.direction *= -1;
            }
            
            // Check collision with player
            if (!this.state.invulnerable && this.player.isColliding({
                x: fireball.x - fireball.radius,
                y: fireball.y - fireball.radius,
                width: fireball.radius * 2,
                height: fireball.radius * 2
            })) {
                this.loseRobot();
                this.playSound('hit');
            } else if (this.state.invulnerable && this.player.isColliding({
                x: fireball.x - fireball.radius,
                y: fireball.y - fireball.radius,
                width: fireball.radius * 2,
                height: fireball.radius * 2
            })) {
                // Destroy fireball when invulnerable
                fireball.x = -100; // Move off screen
                this.state.score += 500;
                this.playSound('destroy');
            }
        });

        // Bombs
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                bomb.fuse--;
                
                if (bomb.fuse <= 0) {
                    bomb.active = false;
                    this.createExplosion(bomb.x, bomb.y);
                }
                
                // Check collision
                if (this.player.isColliding({
                    x: bomb.x - bomb.radius,
                    y: bomb.y - bomb.radius,
                    width: bomb.radius * 2,
                    height: bomb.radius * 2
                }) && bomb.active) {
                    bomb.active = false;
                    this.state.bombs++;
                    this.playSound('collect');
                }
            }
        });
    }

    updatePowerUps() {
        // Update invulnerability
        if (this.state.invulnerable) {
            this.state.invulnerabilityTime--;
            if (this.state.invulnerabilityTime <= 0) {
                this.state.invulnerable = false;
            }
        }

        // Apply magnet forces
        if (this.state.currentLevel >= 12) {
            this.magnets.forEach(magnet => {
                if (magnet.active) {
                    const dx = magnet.x - (this.player.x + this.player.width/2);
                    const dy = magnet.y - (this.player.y + this.player.height/2);
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < 200) {
                        const force = magnet.strength * (1 - distance/200);
                        this.player.velocityX += (dx/distance) * force;
                        this.player.velocityY += (dy/distance) * force;
                    }
                }
            });
        }
    }

    checkDoorCollision() {
        this.doors.forEach(door => {
            if (!door.locked && this.player.isColliding(door)) {
                this.completeLevel();
            }
        });
    }

    checkGameConditions() {
        // Check if all power pills collected (optional objective)
        const allPillsCollected = this.powerPills.every(pill => pill.collected);
        if (allPillsCollected && this.doors[0].locked) {
            this.doors[0].locked = false;
            this.playSound('unlock');
        }

        // Check game over
        if (this.state.robots <= 0) {
            this.gameOver();
        }
    }

    draw() {
        // Draw background
        this.drawBackground();
        
        // Draw platforms
        this.drawPlatforms();
        
        // Draw ladders
        this.drawLadders();
        
        // Draw collectibles
        this.drawCollectibles();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw doors
        this.drawDoors();
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw circuit elements
        this.drawCircuitElements();
    }

    drawBackground() {
        // Solid color background
        this.ctx.fillStyle = '#0a1425';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = 'rgba(50, 100, 150, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawPlatforms() {
        this.ctx.fillStyle = '#3a7abc';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.strokeStyle = '#5a9aec';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawLadders() {
        this.ctx.fillStyle = '#8b7355';
        this.ladders.forEach(ladder => {
            this.ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
            // Draw ladder rungs
            this.ctx.fillStyle = '#5a4a35';
            for (let y = ladder.y + 10; y < ladder.y + ladder.height; y += 20) {
                this.ctx.fillRect(ladder.x, y, ladder.width, 5);
            }
            this.ctx.fillStyle = '#8b7355';
        });
    }

    drawCollectibles() {
        // Power pills
        this.powerPills.forEach(pill => {
            if (!pill.collected) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(pill.x, pill.y, pill.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Rings
        this.rings.forEach(ring => {
            if (!ring.collected) {
                const pulseSize = 3 + Math.sin(ring.pulse) * 2;
                this.ctx.strokeStyle = '#00ffaa';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(ring.x, ring.y, ring.radius + pulseSize, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    drawEnemies() {
        // Fireballs
        this.fireballs.forEach(fireball => {
            if (fireball.x > 0) { // Only draw if on screen
                const gradient = this.ctx.createRadialGradient(
                    fireball.x, fireball.y, 0,
                    fireball.x, fireball.y, fireball.radius
                );
                gradient.addColorStop(0, '#ffaa00');
                gradient.addColorStop(0.7, '#ff5500');
                gradient.addColorStop(1, '#ff0000');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawPowerUps() {
        // Bombs
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                this.ctx.fillStyle = '#333333';
                this.ctx.beginPath();
                this.ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Magnets
        this.magnets.forEach(magnet => {
            if (magnet.active) {
                const magnetGradient = this.ctx.createLinearGradient(
                    magnet.x - magnet.radius, magnet.y,
                    magnet.x + magnet.radius, magnet.y
                );
                magnetGradient.addColorStop(0, '#ff5555');
                magnetGradient.addColorStop(0.5, '#ffffff');
                magnetGradient.addColorStop(1, '#5555ff');
                
                this.ctx.fillStyle = magnetGradient;
                this.ctx.beginPath();
                this.ctx.arc(magnet.x, magnet.y, magnet.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawDoors() {
        this.doors.forEach(door => {
            this.ctx.fillStyle = door.locked ? '#aa3333' : '#33aa33';
            this.ctx.fillRect(door.x, door.y, door.width, door.height);
            
            // Door label
            this.ctx.fillStyle = door.locked ? '#ff5555' : '#55ff55';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(door.locked ? 'LOCKED' : 'ENTER', 
                door.x + door.width/2, door.y + door.height/2);
        });
    }

    drawCircuitElements() {
        const time = Date.now() / 1000;
        
        // Draw floating circuit symbols
        for (let i = 0; i < 5; i++) {
            const x = (Math.sin(time + i) * 100 + i * 200) % this.canvas.width;
            const y = (Math.cos(time * 0.7 + i) * 50 + i * 100) % this.canvas.height;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.globalAlpha = 0.3;
            
            // Different circuit symbols
            if (i % 3 === 0) {
                // Resistor
                this.ctx.strokeStyle = '#ff5555';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-15, 0);
                this.ctx.lineTo(-5, 0);
                for (let j = 0; j < 3; j++) {
                    this.ctx.rect(-5 + j * 10, -5, 10, 10);
                }
                this.ctx.moveTo(25, 0);
                this.ctx.lineTo(15, 0);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }

    createExplosion(x, y) {
        // Create particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const size = 2 + Math.random() * 4;
            
            this.ctx.fillStyle = `hsl(${Math.random() * 30 + 10}, 100%, 50%)`;
            this.ctx.beginPath();
            this.ctx.arc(
                x + Math.cos(angle) * speed * 10,
                y + Math.sin(angle) * speed * 10,
                size, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Check player damage
        const dx = this.player.x + this.player.width/2 - x;
        const dy = this.player.y + this.player.height/2 - y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < 100 && !this.state.invulnerable) {
            this.loseRobot();
        }
        
        this.playSound('explosion');
    }

    loseRobot() {
        this.state.robots--;
        if (this.state.robots > 0) {
            // Reset player position
            this.player.x = 100;
            this.player.y = this.canvas.height - 150;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.state.energy = CONFIG.initialEnergy;
            this.state.invulnerable = false;
            this.state.invulnerabilityTime = 0;
            this.playSound('lose');
        }
    }

    completeLevel() {
        this.state.levelComplete = true;
        this.state.gameRunning = false;
        
        // Calculate bonus
        const energyBonus = Math.floor(this.state.energy) * 100;
        this.state.score += energyBonus;
        
        this.domElements.levelCompleteText.innerHTML = `
            Level ${this.state.currentLevel} Complete!<br>
            Energy Bonus: ${energyBonus} points<br>
            Total Score: ${this.state.score} points<br>
            <small>Circuit Accuracy: ${this.state.getAccuracy()}%</small>
        `;
        
        this.domElements.levelCompleteMessage.style.display = 'block';
        this.playSound('levelComplete');
    }

    gameOver() {
        this.state.gameOver = true;
        this.state.gameRunning = false;
        
        this.domElements.gameOverText.innerHTML = `
            All robots deactivated!<br>
            Final Score: ${this.state.score} points<br>
            Levels Completed: ${this.state.currentLevel - 1}<br>
            Circuit Accuracy: ${this.state.getAccuracy()}%
        `;
        
        this.domElements.gameOverMessage.style.display = 'block';
        this.playSound('gameOver');
    }

    playSound(type) {
        if (!this.state.soundEnabled) return;
        
        // Sound effects would be implemented here
        console.log(`Sound: ${type}`);
        
        // Example implementation with Web Audio API:
        /*
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different events
        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                break;
            // ... other sounds
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        */
    }

    togglePause() {
        this.state.paused = !this.state.paused;
        this.domElements.pauseMessage.style.display = this.state.paused ? 'block' : 'none';
        
        if (this.state.paused) {
            this.playSound('pause');
        }
    }

    setupEventListeners() {
        // Start button
        this.domElements.startButton.addEventListener('click', () => {
            this.domElements.startMessage.style.display = 'none';
            this.state.gameRunning = true;
        });

        // Next level button
        this.domElements.nextLevelButton.addEventListener('click', () => {
            this.domElements.levelCompleteMessage.style.display = 'none';
            if (this.state.currentLevel < CONFIG.levels) {
                this.state.currentLevel++;
                this.loadLevel(this.state.currentLevel);
                this.state.gameRunning = true;
            } else {
                // Game completed
                this.domElements.gameOverText.innerHTML = `
                    Congratulations! You completed all ${CONFIG.levels} levels!<br>
                    Final Score: ${this.state.score} points<br>
                    Master Circuit Engineer!
                `;
                this.domElements.gameOverMessage.style.display = 'block';
            }
        });

        // Restart button
        this.domElements.restartButton.addEventListener('click', () => {
            this.state = new GameState();
            this.loadLevel(1);
            this.showStartMessage();
        });

        // Resume button
        this.domElements.resumeButton.addEventListener('click', () => {
            this.togglePause();
        });

        // Submit answer button
        this.domElements.submitAnswerBtn.addEventListener('click', () => {
            this.submitAnswer();
        });

        // Sound toggle
        this.domElements.soundToggle.addEventListener('click', () => {
            this.state.soundEnabled = !this.state.soundEnabled;
            this.domElements.soundIcon.className = this.state.soundEnabled ? 
                'fas fa-volume-up sound-icon' : 
                'fas fa-volume-mute sound-icon';
        });

        // Instructions
        this.domElements.hideInstructions.addEventListener('click', () => {
            this.domElements.instructionsPanel.style.display = 'none';
        });

        this.domElements.showInstructionsBtn.addEventListener('click', () => {
            this.domElements.instructionsPanel.style.display = 'block';
        });

        this.domElements.viewControls.addEventListener('click', () => {
            this.domElements.instructionsPanel.style.display = 'block';
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.loadLevel(this.state.currentLevel); // Reload level to reposition everything
        });
    }

    setupJoystick() {
        const joystick = document.getElementById('joystick');
        const joystickHandle = document.getElementById('joystick-handle');
        
        let joystickCenterX = 0;
        let joystickCenterY = 0;
        let joystickRadius = 0;

        function initJoystick() {
            const rect = joystick.getBoundingClientRect();
            joystickCenterX = rect.left + rect.width / 2;
            joystickCenterY = rect.top + rect.height / 2;
            joystickRadius = rect.width / 2 - 30;
        }

        joystickHandle.addEventListener('mousedown', startJoystickControl);
        joystickHandle.addEventListener('touchstart', startJoystickControl);

        function startJoystickControl(e) {
            e.preventDefault();
            this.state.joystickActive = true;
            document.addEventListener('mousemove', moveJoystick);
            document.addEventListener('touchmove', moveJoystick);
            document.addEventListener('mouseup', endJoystickControl);
            document.addEventListener('touchend', endJoystickControl);
        }

        function moveJoystick(e) {
            if (!this.state.joystickActive) return;
            
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const dx = clientX - joystickCenterX;
            const dy = clientY - joystickCenterY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            let moveX = dx;
            let moveY = dy;
            
            if (distance > joystickRadius) {
                moveX = (dx / distance) * joystickRadius;
                moveY = (dy / distance) * joystickRadius;
            }
            
            joystickHandle.style.transform = `translate(${moveX}px, ${moveY}px)`;
            
            const threshold = joystickRadius / 3;
            this.input.keys.left = moveX < -threshold;
            this.input.keys.right = moveX > threshold;
            this.input.keys.up = moveY < -threshold;
            this.input.keys.down = moveY > threshold;
            this.input.keys.jump = distance > joystickRadius * 0.8 && moveY < -threshold;
        }

        function endJoystickControl() {
            this.state.joystickActive = false;
            joystickHandle.style.transform = 'translate(-50%, -50%)';
            
            this.input.keys.left = false;
            this.input.keys.right = false;
            this.input.keys.up = false;
            this.input.keys.down = false;
            this.input.keys.jump = false;
            
            document.removeEventListener('mousemove', moveJoystick);
            document.removeEventListener('touchmove', moveJoystick);
            document.removeEventListener('mouseup', endJoystickControl);
            document.removeEventListener('touchend', endJoystickControl);
        }

        // Bind functions to game instance
        startJoystickControl = startJoystickControl.bind(this);
        moveJoystick = moveJoystick.bind(this);
        endJoystickControl = endJoystickControl.bind(this);

        initJoystick();
        window.addEventListener('load', initJoystick);
    }

    submitAnswer() {
        if (this.state.questionAnswered || this.state.selectedOption === null) return;
        
        const options = document.querySelectorAll('.option');
        const isCorrect = this.state.selectedOption === this.state.currentQuestion.correct;
        
        // Mark correct/incorrect
        options.forEach((option, index) => {
            if (index === this.state.currentQuestion.correct) {
                option.classList.add('correct');
            } else if (index === this.state.selectedOption && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        this.state.questionAnswered = true;
        this.state.updateStats(isCorrect);
        this.domElements.submitAnswerBtn.disabled = true;
        
        if (isCorrect) {
            // Unlock door
            this.doors[0].locked = false;
            this.state.score += 500;
            this.playSound('correct');
        } else {
            // Penalty
            this.state.energy -= 20;
            if (this.state.energy < 0) this.state.energy = 0;
            this.playSound('wrong');
        }
        
        this.updateUI();
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
