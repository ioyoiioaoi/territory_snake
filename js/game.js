class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 检测是否为手机并自动调整尺寸
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });

        this.map = new GameMap(this.ctx);
        this.snakes = [];
        this.playerSnake = null;
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulator = 0;

        // Game timer (1 minute = 60 seconds)
        this.gameTimeLimit = 60;
        this.gameTimeRemaining = 60;

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (!this.playerSnake || !this.isRunning) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.playerSnake.setDirection(DIRECTIONS.UP);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.playerSnake.setDirection(DIRECTIONS.DOWN);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.playerSnake.setDirection(DIRECTIONS.LEFT);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.playerSnake.setDirection(DIRECTIONS.RIGHT);
                    break;
            }
        });

        // Mobile touch controls
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');

        const addControl = (btn, direction) => {
            if (btn) {
                const handler = (e) => {
                    e.preventDefault(); // Prevent default touch behavior
                    if (this.playerSnake && this.isRunning) {
                        this.playerSnake.setDirection(direction);
                    }
                };
                btn.addEventListener('touchstart', handler);
                btn.addEventListener('click', handler);
            }
        };

        addControl(btnUp, DIRECTIONS.UP);
        addControl(btnDown, DIRECTIONS.DOWN);
        addControl(btnLeft, DIRECTIONS.LEFT);
        addControl(btnRight, DIRECTIONS.RIGHT);
    }

    setupCanvas() {
        const isMobile = window.innerWidth <= 768;
        const rotateMessage = document.getElementById('rotate-message');
        const gameContainer = document.getElementById('game-container');
        // const mobileControls = document.getElementById('mobile-controls'); // Controls are now managed by CSS

        if (isMobile) {
            const isPortrait = window.innerHeight > window.innerWidth;

            if (isPortrait) {
                // Show rotation message in portrait mode
                if (rotateMessage) rotateMessage.style.display = 'flex';
                if (gameContainer) gameContainer.style.display = 'none';
            } else {
                // Hide rotation message in landscape mode
                if (rotateMessage) rotateMessage.style.display = 'none';
                if (gameContainer) gameContainer.style.display = 'block';

                // Set canvas size
                this.canvas.width = CANVAS_WIDTH;
                this.canvas.height = CANVAS_HEIGHT;

                // Scale canvas to fit mobile screen
                const availableWidth = window.innerWidth;
                const availableHeight = window.innerHeight;

                const scaleX = availableWidth / CANVAS_WIDTH;
                const scaleY = availableHeight / CANVAS_HEIGHT;
                const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1x

                // Apply scale
                gameContainer.style.transform = `scale(${scale})`;
                gameContainer.style.transformOrigin = 'top center';
            }
        } else {
            // Desktop - always show game, hide rotation message
            if (rotateMessage) rotateMessage.style.display = 'none';
            if (gameContainer) gameContainer.style.display = 'block';

            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = CANVAS_HEIGHT;
            gameContainer.style.transform = 'scale(1)'; // Reset scale
        }
    }

    start(playerFactionKey) {
        this.snakes = [];
        this.gameTimeRemaining = this.gameTimeLimit;

        this.playerSnake = new Snake(playerFactionKey, this.ctx, this.map, false);
        this.snakes.push(this.playerSnake);

        Object.keys(FACTIONS).forEach(key => {
            if (key !== playerFactionKey) {
                this.snakes.push(new Snake(key, this.ctx, this.map, true));
            }
        });

        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastTimerUpdate = performance.now();

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');

        requestAnimationFrame((t) => this.loop(t));

        // Show mobile controls if on mobile
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls && window.innerWidth <= 768) {
            mobileControls.classList.remove('hidden');
        }

        setInterval(() => {
            if (this.isRunning) this.map.spawnResource();
        }, 1000); // 每1秒生成一个资源
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        // Update timer
        if (currentTime - this.lastTimerUpdate >= 1000) {
            this.gameTimeRemaining--;
            this.lastTimerUpdate = currentTime;

            if (this.gameTimeRemaining <= 0) {
                this.timeUp();
                return;
            }
        }

        this.update(currentTime);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(currentTime) {
        this.snakes.forEach(snake => {
            if (snake.alive) {
                if (currentTime - snake.lastMoveTime > snake.faction.speed) {
                    snake.update(this.snakes);
                    snake.lastMoveTime = currentTime;
                }
            }
        });

        if (!this.playerSnake.alive) {
            this.gameOver(false);
        } else {
            const aliveFactions = this.snakes.filter(s => s.alive).length;
            if (aliveFactions === 1 && this.playerSnake.alive) {
                this.gameOver(true);
            }
        }

        this.updateHUD();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.map.draw();
        this.snakes.forEach(s => s.draw());
    }

    updateHUD() {
        const manchukuoScore = this.map.getTerritoryCount(FACTIONS.MANCHUKUO.id);
        const rocScore = this.map.getTerritoryCount(FACTIONS.ROC.id);
        const japanScore = this.map.getTerritoryCount(FACTIONS.JAPAN.id);

        document.getElementById('score-manchukuo').innerHTML = `
            <img src="PIC/滿州國.png" class="flag-icon" alt="滿洲國">
            ${FACTIONS.MANCHUKUO.name}: ${manchukuoScore}
        `;
        document.getElementById('score-roc').innerHTML = `
            <img src="PIC/中華民國.png" class="flag-icon" alt="中華民國">
            ${FACTIONS.ROC.name}: ${rocScore}
        `;
        document.getElementById('score-japan').innerHTML = `
            <img src="PIC/日本.png" class="flag-icon" alt="日本">
            ${FACTIONS.JAPAN.name}: ${japanScore}
        `;

        // Update timer display
        const minutes = Math.floor(this.gameTimeRemaining / 60);
        const seconds = this.gameTimeRemaining % 60;
        document.getElementById('timer').innerText = `時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    timeUp() {
        this.isRunning = false;

        // Determine winner by territory
        const scores = [
            { faction: FACTIONS.MANCHUKUO, score: this.map.getTerritoryCount(FACTIONS.MANCHUKUO.id) },
            { faction: FACTIONS.ROC, score: this.map.getTerritoryCount(FACTIONS.ROC.id) },
            { faction: FACTIONS.JAPAN, score: this.map.getTerritoryCount(FACTIONS.JAPAN.id) }
        ];

        scores.sort((a, b) => b.score - a.score);
        const winner = scores[0].faction;

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('winner-text').innerText = `時間到！${winner.name} 勝利！`;
    }

    gameOver(win) {
        this.isRunning = false;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('winner-text').innerText = win ? "勝利！" : "失敗！";
    }
}
