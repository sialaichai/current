// Game Configuration
const CONFIG = {
  gravity: 0.5,
  jumpForce: -12,
  moveSpeed: 5,
  climbSpeed: 4,
  energyDrainRate: 0.02,
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
        case 'a': this.keys.left = true; break;
        case 'arrowright':
        case 'd': this.keys.right = true; break;
        case 'arrowup':
        case 'w': this.keys.up = true; break;
        case 'arrowdown':
        case 's': this.keys.down = true; break;
        case ' ': 
          this.keys.jump = true;
          this.keys.space = true;
          e.preventDefault();
          break;
        case 'p':
          if (typeof window.game !== 'undefined') {
            window.game.togglePause();
          }
          break;
      }
    });
    document.addEventListener('keyup', (e) => {
      switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a': this.keys.left = false; break;
        case 'arrowright':
        case 'd': this.keys.right = false; break;
        case 'arrowup':
        case 'w': this.keys.up = false; break;
        case 'arrowdown':
        case 's': this.keys.down = false; break;
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
      if (!element) return;
      element.addEventListener('touchstart', (e) => {
        this.keys[key] = true;
        e.preventDefault();
      });
      element.addEventListener('touchend', () => this.keys[key] = false);
      element.addEventListener('touchcancel', () => this.keys[key] = false);
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
    this.width = 32;   // Reduced size
    this.height = 48;  // Reduced size
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    this.climbing = false;
    this.facingRight = true;
  }

  update(input, platforms, ladders, canvasHeight) {
    if (!this.climbing) {
      this.velocityY += CONFIG.gravity;
    }

    this.velocityX = 0;
    if (input.keys.left) {
      this.velocityX = -CONFIG.moveSpeed;
      this.facingRight = false;
    }
    if (input.keys.right) {
      this.velocityX = CONFIG.moveSpeed;
      this.facingRight = true;
    }

    if (input.keys.jump && this.onGround && !this.climbing) {
      this.velocityY = CONFIG.jumpForce;
      if (typeof window.game !== 'undefined') {
        window.game.playSound('jump');
      }
    }

    const nextX = this.x + this.velocityX;
    const nextY = this.y + this.velocityY;

    this.x = Math.max(0, Math.min(canvasHeight - this.width, nextX));

    this.onGround = false;
    this.climbing = false;

    for (const ladder of ladders) {
      if (
        nextX < ladder.x + ladder.width &&
        nextX + this.width > ladder.x &&
        nextY < ladder.y + ladder.height &&
        nextY + this.height > ladder.y
      ) {
        this.climbing = true;
        if (input.keys.up) this.y -= CONFIG.climbSpeed;
        if (input.keys.down && this.y < canvasHeight - this.height) {
          this.y += CONFIG.climbSpeed;
        }
        break;
      }
    }

    if (!this.climbing) {
      this.y = nextY;

      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y < platform.y + platform.height &&
          this.y + this.height > platform.y
        ) {
          if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.onGround = true;
          }
          else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height) {
            this.y = platform.y + platform.height;
            this.velocityY = 0;
          }
          else if (!this.onGround) {
            if (this.velocityX > 0) {
              this.x = platform.x - this.width;
            } else if (this.velocityX < 0) {
              this.x = platform.x + platform.width;
            }
            this.velocityX = 0;
          }
        }
      }
    }

    const floorY = canvasHeight - 20;
    if (this.y + this.height > floorY) {
      this.y = floorY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }
  }

  draw(ctx) {
    const isInvulnerable = window.game ? window.game.state.invulnerable : false;
    ctx.fillStyle = isInvulnerable ? '#00aaff' : '#4fc3ff';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#2a8cd0';
    ctx.fillRect(this.x + this.width/4, this.y - 12, this.width/2, 16);

    ctx.fillStyle = '#00ff00';
    const eyeX = this.facingRight ? this.x + this.width * 0.7 : this.x + this.width * 0.3;
    ctx.beginPath();
    ctx.arc(eyeX, this.y + this.height/3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isInvulnerable) {
      ctx.arc(this.x + this.width/2, this.y + this.height * 0.7, 6, 0, Math.PI);
    } else {
      ctx.moveTo(this.x + this.width/3, this.y + this.height * 0.7);
      ctx.lineTo(this.x + this.width * 2/3, this.y + this.height * 0.7);
    }
    ctx.stroke();

    if (isInvulnerable) {
      const time = Date.now() / 100;
      const pulse = Math.sin(time) * 4 + 8;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
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

    this.player = null;
    this.platforms = [];
    this.powerPills = [];
    this.rings = [];
    this.fireballs = [];
    this.bombs = [];
    this.magnets = [];
    this.doors = [];
    this.ladders = [];

    this.domElements = this.cacheDomElements();
    this.init();
    this.setupEventListeners();
    this.showStartScreen();
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
      ringCount: document.getElementById('ring-count'),
      invTime: document.getElementById('inv-time'),
      bombCount: document.getElementById('bomb-count'),
      soundToggle: document.getElementById('sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      startScreen: document.getElementById('start-screen'),
      startButton: document.getElementById('start-button'),
      toggleSoundStart: document.getElementById('toggle-sound-start'),
      levelCompleteMessage: document.getElementById('level-complete-message'),
      levelCompleteText: document.getElementById('level-complete-text'),
      nextLevelButton: document.getElementById('next-level-button'),
      mainMenuButton: document.getElementById('main-menu-button'),
      gameOverMessage: document.getElementById('game-over-message'),
      gameOverText: document.getElementById('game-over-text'),
      restartButton: document.getElementById('restart-button'),
      backToMenu: document.getElementById('back-to-menu'),
      pauseMessage: document.getElementById('pause-message'),
      resumeButton: document.getElementById('resume-button'),
      pauseToMenu: document.getElementById('pause-to-menu'),
      // Overlay elements
      overlayQuestionText: document.getElementById('overlay-question-text'),
      overlayOptionsContainer: document.getElementById('overlay-options-container'),
      overlaySubmitAnswerBtn: document.getElementById('overlay-submit-answer')
    };
  }

  init() {
    this.resizeCanvas();
    this.loadLevel(1);
    this.addStatsStyles();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    }
  }

  showStartScreen() {
    if (this.domElements.startScreen) this.domElements.startScreen.style.display = 'block';
    if (this.domElements.levelCompleteMessage) this.domElements.levelCompleteMessage.style.display = 'none';
    if (this.domElements.gameOverMessage) this.domElements.gameOverMessage.style.display = 'none';
    if (this.domElements.pauseMessage) this.domElements.pauseMessage.style.display = 'none';

    const gameCanvas = document.querySelector('#game-canvas-container');
    const controlsPanel = document.querySelector('.controls-panel');
    if (gameCanvas) gameCanvas.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'none';

    this.state.gameRunning = false;
  }

  showGameScreen() {
    if (this.domElements.startScreen) this.domElements.startScreen.style.display = 'none';
    const gameCanvas = document.querySelector('#game-canvas-container');
    const controlsPanel = document.querySelector('.controls-panel');
    if (gameCanvas) gameCanvas.style.display = 'block';
    if (controlsPanel) controlsPanel.style.display = 'grid';
    this.state.gameRunning = true;
    this.playSound('start');
  }

  loadLevel(level) {
    this.platforms = [];
    this.powerPills = [];
    this.rings = [];
    this.fireballs = [];
    this.bombs = [];
    this.magnets = [];
    this.doors = [];
    this.ladders = [];

    this.createLevel(level);

    const floorY = this.canvas.height - 20;
    this.player = new Player(100, floorY - 100);

    this.updateLevelDisplay(level);
    this.state.resetForNewLevel();
    this.updateUI();
  }

  createLevel(level) {
    const baseY = this.canvas.height - 20;
    this.platforms.push({ x: 0, y: baseY, width: this.canvas.width, height: 20 });

    // Lower door for Level 1
    const doorY = level === 1 
      ? this.canvas.height - 300 
      : 150;

    this.doors.push({
      x: this.canvas.width - 120,  // Reduced width offset
      y: doorY,
      width: 50,                   // Smaller
      height: 80,                  // Smaller
      locked: true
    });

    if (level === 1) {
      this.platforms.push({ x: 200, y: baseY - 150, width: 200, height: 20 });
      this.platforms.push({ x: 500, y: baseY - 250, width: 200, height: 20 });
      this.ladders.push({ x: 300, y: baseY - 150, width: 20, height: 150 });
    } else {
      const platformCount = 5 + Math.min(level, 10);
      for (let i = 0; i < platformCount; i++) {
        const x = 100 + i * (this.canvas.width - 200) / platformCount;
        const y = baseY - 50 - (i % 4) * 80;
        const width = 80 + Math.random() * 100;
        this.platforms.push({ x, y, width, height: 20 });
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

    this.createCollectibles(level);
  }

  createCollectibles(level) {
    const pillCount = 15 + level * 2;
    for (let i = 0; i < pillCount; i++) {
      const platform = this.platforms[i % this.platforms.length];
      this.powerPills.push({
        x: platform.x + 20 + Math.random() * (platform.width - 40),
        y: platform.y - 12,
        radius: 6,  // Smaller
        collected: false
      });
    }

    const ringCount = 3 + Math.floor(level / 4);
    for (let i = 0; i < ringCount; i++) {
      const platform = this.platforms[Math.min(i + 2, this.platforms.length - 1)];
      this.rings.push({
        x: platform.x + platform.width/2,
        y: platform.y - 25,
        radius: 12, // Smaller
        collected: false,
        pulse: 0
      });
    }

    const fireballCount = 2 + Math.floor(level / 3);
    for (let i = 0; i < fireballCount; i++) {
      const platform = this.platforms[i % this.platforms.length];
      this.fireballs.push({
        x: platform.x + platform.width - 30,
        y: platform.y - 20,
        radius: 12, // Smaller
        speed: 0.5 + Math.random() * 0.8, // Slower
        direction: -1,
        minX: platform.x + 20,
        maxX: platform.x + platform.width - 20
      });
    }

    if (level >= 8) {
      for (let i = 0; i < Math.min(3, this.platforms.length - 2); i++) {
        const platform = this.platforms[i + 2];
        this.bombs.push({
          x: platform.x + platform.width/2,
          y: platform.y - 12,
          radius: 10,
          active: true,
          fuse: 300 + Math.random() * 300
        });
      }
    }

    if (level >= 12) {
      for (let i = 0; i < 2; i++) {
        this.magnets.push({
          x: 200 + i * 400,
          y: 200,
          radius: 20,
          strength: 0.5,
          active: true
        });
      }
    }
  }

  updateLevelDisplay(level) {
    if (this.domElements.level) {
      this.domElements.level.textContent = level;
    }
    if (this.domElements.levelName) {
      this.domElements.levelName.textContent = CONFIG.levelNames[level - 1] || `Circuit Level ${level}`;
    }
  }

  loadQuestion() {
    this.state.currentQuestion = getRandomQuestion(this.state.currentLevel);
    
    // Use overlay
    if (this.domElements.overlayQuestionText && this.state.currentQuestion) {
      this.domElements.overlayQuestionText.textContent = this.state.currentQuestion.question;
    }

    if (this.domElements.overlayOptionsContainer) {
      this.domElements.overlayOptionsContainer.innerHTML = '';
      if (this.state.currentQuestion) {
        this.state.currentQuestion.options.forEach((option, index) => {
          const optionEl = document.createElement('div');
          optionEl.className = 'option';
          optionEl.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
          optionEl.dataset.index = index;
          optionEl.addEventListener('click', () => {
            if (!this.state.questionAnswered) {
              document.querySelectorAll('#overlay-options-container .option').forEach(opt => opt.classList.remove('selected'));
              optionEl.classList.add('selected');
              this.state.selectedOption = index;
            }
          });
          this.domElements.overlayOptionsContainer.appendChild(optionEl);
        });
      }
    }

    this.state.questionAnswered = false;
    this.state.selectedOption = null;

    // Show overlay
    document.getElementById('question-overlay-bg').style.display = 'block';
    document.getElementById('circuit-question-overlay').style.display = 'block';
  }

  updateUI() {
    if (this.domElements.robotCount) this.domElements.robotCount.textContent = this.state.robots;
    if (this.domElements.energyValue) this.domElements.energyValue.textContent = Math.floor(this.state.energy);
    if (this.domElements.energyFill) this.domElements.energyFill.style.width = `${this.state.energy}%`;
    if (this.domElements.score) this.domElements.score.textContent = this.state.score;
    if (this.domElements.ringCount) this.domElements.ringCount.textContent = this.state.rings;
    if (this.domElements.invTime) this.domElements.invTime.textContent = `${Math.floor(this.state.invulnerabilityTime/60)}s`;
    if (this.domElements.bombCount) this.domElements.bombCount.textContent = this.state.bombs;

    const invulnerableElement = document.querySelector('.power-up.invulnerable');
    if (invulnerableElement) {
      invulnerableElement.classList.toggle('active', this.state.invulnerable);
    }
  }

  gameLoop() {
    if (!this.state.gameRunning || this.state.paused ||
      (this.domElements.startScreen && this.domElements.startScreen.style.display !== 'none')) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.update();
    this.draw();
    this.checkGameConditions();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.player.update(this.input, this.platforms, this.ladders, this.canvas.height);
    this.updateCollectibles();

    // Freeze enemies during question
    const isQuestionActive = this.state.currentQuestion && !this.state.questionAnswered;
    if (!isQuestionActive) {
      this.updateEnemies();
      this.updatePowerUps();
      // Drain energy only when not in question
      this.state.energy -= CONFIG.energyDrainRate;
      if (this.state.energy <= 0) {
        this.state.energy = 0;
        this.loseRobot();
      }
    }

    this.checkDoorCollision();
  }

  updateCollectibles() {
    this.powerPills.forEach(pill => {
      if (!pill.collected && this.isCollidingCircleRect(
        pill.x, pill.y, pill.radius,
        this.player.x, this.player.y, this.player.width, this.player.height
      )) {
        pill.collected = true;
        this.state.score += 10;
        this.playSound('collect');
      }
    });

    this.rings.forEach(ring => {
      if (!ring.collected) {
        ring.pulse = (ring.pulse + 0.1) % (Math.PI * 2);
        if (this.isCollidingCircleRect(
          ring.x, ring.y, ring.radius,
          this.player.x, this.player.y, this.player.width, this.player.height
        )) {
          ring.collected = true;
          this.state.rings++;
          this.state.score += 100;
          this.state.invulnerable = true;
          this.state.invulnerabilityTime = 600;
          this.playSound('ring');
        }
      }
    });
  }

  updateEnemies() {
    this.fireballs.forEach(fireball => {
      fireball.x += fireball.speed * fireball.direction;
      if (fireball.x <= fireball.minX || fireball.x >= fireball.maxX) {
        fireball.direction *= -1;
      }

      const colliding = this.isCollidingCircleRect(
        fireball.x, fireball.y, fireball.radius,
        this.player.x, this.player.y, this.player.width, this.player.height
      );

      if (!this.state.invulnerable && colliding) {
        this.loseRobot();
        this.playSound('hit');
      } else if (this.state.invulnerable && colliding) {
        fireball.x = -100;
        this.state.score += 500;
        this.playSound('destroy');
      }
    });

    this.bombs.forEach(bomb => {
      if (bomb.active) {
        bomb.fuse--;
        if (bomb.fuse <= 0) {
          bomb.active = false;
          this.createExplosion(bomb.x, bomb.y);
        }
        if (bomb.active && this.isCollidingCircleRect(
          bomb.x, bomb.y, bomb.radius,
          this.player.x, this.player.y, this.player.width, this.player.height
        )) {
          bomb.active = false;
          this.state.bombs++;
          this.playSound('collect');
        }
      }
    });
  }

  updatePowerUps() {
    if (this.state.invulnerable) {
      this.state.invulnerabilityTime--;
      if (this.state.invulnerabilityTime <= 0) {
        this.state.invulnerable = false;
      }
    }

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
      const touching = this.isCollidingRectRect(
        this.player.x, this.player.y, this.player.width, this.player.height,
        door.x, door.y, door.width, door.height
      );

      if (touching) {
        if (door.locked && !this.state.currentQuestion) {
          // Trigger question only if not already active
          const allPillsCollected = this.powerPills.every(p => p.collected);
          if (allPillsCollected) {
            this.loadQuestion();
          }
        } else if (!door.locked) {
          this.completeLevel();
        }
      }
    });
  }

  checkGameConditions() {
    const allPillsCollected = this.powerPills.every(pill => pill.collected);
    if (allPillsCollected && this.doors.length > 0 && this.doors[0].locked && !this.state.currentQuestion) {
      // Door unlocks automatically when all pills collected
      this.doors[0].locked = false;
      this.playSound('unlock');
    }

    if (this.state.robots <= 0) {
      this.gameOver();
    }
  }

  draw() {
    this.drawBackground();
    this.drawPlatforms();
    this.drawLadders();
    this.drawCollectibles();
    this.drawEnemies();
    this.drawPowerUps();
    this.drawDoors();
    this.player.draw(this.ctx);
    this.drawCircuitElements();
  }

  drawBackground() {
    this.ctx.fillStyle = '#0a1425';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = 'rgba(50, 100, 150, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
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
      this.ctx.fillStyle = '#5a4a35';
      for (let y = ladder.y + 10; y < ladder.y + ladder.height; y += 20) {
        this.ctx.fillRect(ladder.x, y, ladder.width, 5);
      }
      this.ctx.fillStyle = '#8b7355';
    });
  }

  drawCollectibles() {
    this.powerPills.forEach(pill => {
      if (!pill.collected) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(pill.x, pill.y, pill.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.rings.forEach(ring => {
      if (!ring.collected) {
        const pulseSize = 2 + Math.sin(ring.pulse) * 1.5;
        this.ctx.strokeStyle = '#00ffaa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ring.x, ring.y, ring.radius + pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }

  drawEnemies() {
    this.fireballs.forEach(fireball => {
      if (fireball.x > 0) {
        const gradient = this.ctx.createRadialGradient(fireball.x, fireball.y, 0, fireball.x, fireball.y, fireball.radius);
        gradient.addColorStop(0, '#ffaa00'); gradient.addColorStop(0.7, '#ff5500'); gradient.addColorStop(1, '#ff0000');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath(); this.ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2); this.ctx.fill();
      }
    });
  }

  drawPowerUps() {
    this.bombs.forEach(bomb => {
      if (bomb.active) {
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath(); this.ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2); this.ctx.fill();
      }
    });

    this.magnets.forEach(magnet => {
      if (magnet.active) {
        const grad = this.ctx.createLinearGradient(magnet.x - magnet.radius, magnet.y, magnet.x + magnet.radius, magnet.y);
        grad.addColorStop(0, '#ff5555'); grad.addColorStop(0.5, '#ffffff'); grad.addColorStop(1, '#5555ff');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath(); this.ctx.arc(magnet.x, magnet.y, magnet.radius, 0, Math.PI * 2); this.ctx.fill();
      }
    });
  }

  drawDoors() {
    this.doors.forEach(door => {
      this.ctx.fillStyle = door.locked ? '#aa3333' : '#33aa33';
      this.ctx.fillRect(door.x, door.y, door.width, door.height);
      this.ctx.fillStyle = door.locked ? '#ff5555' : '#55ff55';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
      this.ctx.fillText(door.locked ? 'LOCKED' : 'ENTER', door.x + door.width/2, door.y + door.height/2);
    });
  }

  drawCircuitElements() {
    const time = Date.now() / 1000;
    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(time + i) * 100 + i * 200) % this.canvas.width;
      const y = (Math.cos(time * 0.7 + i) * 50 + i * 100) % this.canvas.height;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.globalAlpha = 0.3;
      if (i % 3 === 0) {
        this.ctx.strokeStyle = '#ff5555'; this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 0); this.ctx.lineTo(-4, 0);
        for (let j = 0; j < 3; j++) this.ctx.rect(-4 + j * 8, -4, 8, 8);
        this.ctx.moveTo(20, 0); this.ctx.lineTo(12, 0); this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const size = 2 + Math.random() * 4;
      this.ctx.fillStyle = `hsl(${Math.random() * 30 + 10}, 100%, 50%)`;
      this.ctx.beginPath();
      this.ctx.arc(x + Math.cos(angle) * speed * 10, y + Math.sin(angle) * speed * 10, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const dx = this.player.x + this.player.width/2 - x;
    const dy = this.player.y + this.player.height/2 - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 100 && !this.state.invulnerable) {
      this.loseRobot();
    }
    this.playSound('explosion');
  }

  loseRobot() {
    this.state.robots--;
    if (this.state.robots > 0) {
      const floorY = this.canvas.height - 20;
      this.player.x = 100;
      this.player.y = floorY - 100;
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
    const energyBonus = Math.floor(this.state.energy) * 100;
    this.state.score += energyBonus;
    if (this.domElements.levelCompleteText) {
      this.domElements.levelCompleteText.innerHTML = `
        <h3>Level ${this.state.currentLevel} Complete!</h3>
        <div class="level-stats">
          <div class="stat-item"><span class="stat-label">Energy Bonus:</span><span class="stat-value">${energyBonus} points</span></div>
          <div class="stat-item"><span class="stat-label">Total Score:</span><span class="stat-value">${this.state.score} points</span></div>
          <div class="stat-item"><span class="stat-label">Circuit Accuracy:</span><span class="stat-value">${this.state.getAccuracy()}%</span></div>
        </div>
      `;
    }
    if (this.domElements.levelCompleteMessage) {
      this.domElements.levelCompleteMessage.style.display = 'block';
    }
    this.playSound('levelComplete');
  }

  gameOver() {
    this.state.gameOver = true;
    this.state.gameRunning = false;
    if (this.domElements.gameOverText) {
      this.domElements.gameOverText.innerHTML = `
        <h3>Factory Shutdown!</h3>
        <div class="game-over-stats">
          <div class="stat-item"><span class="stat-label">Final Score:</span><span class="stat-value">${this.state.score} points</span></div>
          <div class="stat-item"><span class="stat-label">Levels Completed:</span><span class="stat-value">${this.state.currentLevel - 1}</span></div>
          <div class="stat-item"><span class="stat-label">Circuit Accuracy:</span><span class="stat-value">${this.state.getAccuracy()}%</span></div>
        </div>
        <p>Try again to beat your score!</p>
      `;
    }
    if (this.domElements.gameOverMessage) {
      this.domElements.gameOverMessage.style.display = 'block';
    }
    this.playSound('gameOver');
  }

  playSound(type) {
    if (!this.state.soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      let frequency, duration = 0.2;
      switch(type) {
        case 'jump': frequency = 400; duration = 0.1; break;
        case 'collect': frequency = 600; break;
        case 'ring': frequency = 800; break;
        case 'hit': frequency = 200; break;
        case 'destroy': frequency = 1000; break;
        case 'explosion': frequency = 150; duration = 0.5; break;
        case 'unlock': frequency = 700; break;
        case 'correct': frequency = 900; break;
        case 'wrong': frequency = 250; break;
        case 'levelComplete': frequency = 1200; duration = 0.3; break;
        case 'gameOver': frequency = 100; duration = 0.8; break;
        case 'start': frequency = 500; break;
        case 'pause': frequency = 300; break;
        default: frequency = 440;
      }

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log(`Sound effect: ${type}`);
    }
  }

  togglePause() {
    this.state.paused = !this.state.paused;
    if (this.domElements.pauseMessage) {
      this.domElements.pauseMessage.style.display = this.state.paused ? 'block' : 'none';
    }
    if (this.state.paused) this.playSound('pause');
  }

  setupEventListeners() {
    // Start Screen
    if (this.domElements.startButton) {
      this.domElements.startButton.addEventListener('click', () => {
        this.showGameScreen();
      });
    }
    if (this.domElements.toggleSoundStart) {
      this.domElements.toggleSoundStart.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        if (this.domElements.soundIcon) {
          this.domElements.soundIcon.className = this.state.soundEnabled
            ? 'fas fa-volume-up sound-icon'
            : 'fas fa-volume-mute sound-icon';
        }
      });
    }

    // Overlay Submit
    if (this.domElements.overlaySubmitAnswerBtn) {
      this.domElements.overlaySubmitAnswerBtn.addEventListener('click', () => {
        this.submitAnswer();
      });
    }

    // In-Game Sound Toggle
    if (this.domElements.soundToggle) {
      this.domElements.soundToggle.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        if (this.domElements.soundIcon) {
          this.domElements.soundIcon.className = this.state.soundEnabled
            ? 'fas fa-volume-up sound-icon'
            : 'fas fa-volume-mute sound-icon';
        }
      });
    }

    // Level Complete
    if (this.domElements.nextLevelButton) {
      this.domElements.nextLevelButton.addEventListener('click', () => {
        this.state.currentLevel++;
        if (this.state.currentLevel > CONFIG.levels) {
          this.state.currentLevel = 1;
        }
        this.loadLevel(this.state.currentLevel);
        if (this.domElements.levelCompleteMessage) {
          this.domElements.levelCompleteMessage.style.display = 'none';
        }
        this.state.gameRunning = true;
      });
    }
    if (this.domElements.mainMenuButton) {
      this.domElements.mainMenuButton.addEventListener('click', () => {
        this.showMainMenu();
      });
    }

    // Game Over
    if (this.domElements.restartButton) {
      this.domElements.restartButton.addEventListener('click', () => {
        this.state = new GameState();
        this.loadLevel(1);
        if (this.domElements.gameOverMessage) {
          this.domElements.gameOverMessage.style.display = 'none';
        }
        this.state.gameRunning = true;
      });
    }
    if (this.domElements.backToMenu) {
      this.domElements.backToMenu.addEventListener('click', () => {
        this.showMainMenu();
      });
    }

    // Pause Menu
    if (this.domElements.resumeButton) {
      this.domElements.resumeButton.addEventListener('click', () => {
        this.state.paused = false;
        if (this.domElements.pauseMessage) {
          this.domElements.pauseMessage.style.display = 'none';
        }
      });
    }
    if (this.domElements.pauseToMenu) {
      this.domElements.pauseToMenu.addEventListener('click', () => {
        this.showMainMenu();
      });
    }
  }

  showMainMenu() {
    this.showStartScreen();
  }

  submitAnswer() {
    // Hide overlay
    document.getElementById('question-overlay-bg').style.display = 'none';
    document.getElementById('circuit-question-overlay').style.display = 'none';

    if (this.state.questionAnswered || this.state.selectedOption === null) return;

    const options = document.querySelectorAll('#overlay-options-container .option');
    const isCorrect = this.state.selectedOption === this.state.currentQuestion.correct;

    options.forEach((option, index) => {
      if (index === this.state.currentQuestion.correct) option.classList.add('correct');
      else if (index === this.state.selectedOption && !isCorrect) option.classList.add('incorrect');
    });

    this.state.questionAnswered = true;
    this.state.updateStats(isCorrect);

    if (isCorrect) {
      if (this.doors.length > 0) this.doors[0].locked = false;
      this.state.score += 500;
      this.playSound('correct');
    } else {
      this.state.energy -= 20;
      if (this.state.energy < 0) this.state.energy = 0;
      this.playSound('wrong');
    }
    this.updateUI();
  }

  addStatsStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .stat-item { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; }
      .stat-label { color: #80d0ff; }
      .stat-value { color: #fff; font-weight: bold; }
      .game-over-stats, .level-stats { margin-top: 15px; }
    `;
    document.head.appendChild(style);
  }

  isCollidingCircleRect(cx, cy, r, rx, ry, rw, rh) {
    const dx = Math.max(rx - cx, 0, cx - (rx + rw));
    const dy = Math.max(ry - cy, 0, cy - (ry + rh));
    return (dx*dx + dy*dy) <= r*r;
  }

  isCollidingRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }
}

// Initialize game
window.addEventListener('load', () => {
  window.game = new Game();
});
