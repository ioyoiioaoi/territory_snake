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

        // Game statistics tracking
        this.gameEvents = []; // Track all game events
        this.territoryHistory = []; // Track territory over time
        this.lastSnapshotTime = 0;
        this.gameStartTime = 0;

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
                    e.preventDefault(); // Prevent default touch behavior and click delay

                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(15);
                    }

                    if (this.playerSnake && this.isRunning) {
                        this.playerSnake.setDirection(direction);
                    }
                };

                // Use passive: false to allow preventDefault() and ensure immediate response
                btn.addEventListener('touchstart', handler, { passive: false });
                btn.addEventListener('mousedown', handler); // Use mousedown for faster desktop response than click
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

        this.playerSnake = new Snake(playerFactionKey, this.ctx, this.map, this, false);
        this.snakes.push(this.playerSnake);

        Object.keys(FACTIONS).forEach(key => {
            if (key !== playerFactionKey) {
                this.snakes.push(new Snake(key, this.ctx, this.map, this, true));
            }
        });

        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastTimerUpdate = performance.now();
        this.gameStartTime = performance.now();
        this.lastSnapshotTime = performance.now();
        this.gameEvents = [];
        this.territoryHistory = [];

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
        // Take territory snapshot every 2 seconds
        if (currentTime - this.lastSnapshotTime >= 2000) {
            const snapshot = {
                time: Math.floor((currentTime - this.gameStartTime) / 1000),
                territories: {}
            };
            this.snakes.forEach(snake => {
                snapshot.territories[snake.faction.name] = this.map.getTerritoryCount(snake.faction.id);
            });
            this.territoryHistory.push(snapshot);
            this.lastSnapshotTime = currentTime;
        }

        this.snakes.forEach(snake => {
            if (snake.alive) {
                if (currentTime - snake.lastMoveTime > snake.getSpeed(currentTime)) {
                    snake.update(this.snakes, currentTime);
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
        this.snakes.forEach(snake => {
            const scoreElement = document.getElementById(`score-${snake.faction.id === 1 ? 'manchukuo' : snake.faction.id === 2 ? 'roc' : 'japan'}`);
            if (scoreElement) {
                const territoryCount = this.map.getTerritoryCount(snake.faction.id);
                scoreElement.innerHTML = `
                    <img src="${snake.faction.flagImage}" class="flag-icon" alt="${snake.faction.name}">
                    ${snake.faction.name}: ${territoryCount}
                `;
            }
        });

        // Update timer display
        const minutes = Math.floor(this.gameTimeRemaining / 60);
        const seconds = this.gameTimeRemaining % 60;
        document.getElementById('timer').innerText = `時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    showNotification(text) {
        const notification = document.createElement('div');
        notification.innerText = text;
        notification.style.position = 'absolute';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(255, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '20px 40px';
        notification.style.fontSize = '2em';
        notification.style.borderRadius = '10px';
        notification.style.zIndex = '10000';
        notification.style.animation = 'fadeInOut 3s forwards';

        // Add keyframes if not exists (simple fade)
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.innerHTML = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -60%); }
                    10% { opacity: 1; transform: translate(-50%, -50%); }
                    90% { opacity: 1; transform: translate(-50%, -50%); }
                    100% { opacity: 0; transform: translate(-50%, -40%); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    timeUp() {
        this.isRunning = false;

        // Determine winner by territory using actual snakes
        const scores = this.snakes.map(snake => ({
            snake: snake,
            score: this.map.getTerritoryCount(snake.faction.id)
        }));

        scores.sort((a, b) => b.score - a.score);
        const winner = scores[0].snake;

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('winner-text').innerText = `時間到！${winner.faction.name} 勝利！`;

        // Generate report for time-up scenario
        this.generateReport();
    }

    logEvent(type, data) {
        const gameTime = Math.floor((performance.now() - this.gameStartTime) / 1000);
        this.gameEvents.push({
            time: gameTime,
            type: type,
            data: data
        });
    }

    gameOver(win) {
        this.isRunning = false;

        // Generate final report
        this.showGameReport(win);
    }

    showGameReport(win) {
        document.getElementById('game-over-screen').classList.remove('hidden');

        let message = "遊戲結束";
        if (win) {
            message = `${this.playerSnake.faction.name} 勝利！`;
        } else {
            // Find if anyone else won (only one survivor)
            const survivors = this.snakes.filter(s => s.alive);
            if (survivors.length === 1) {
                message = `${survivors[0].faction.name} 勝利！`;
            } else {
                message = "你輸了";
            }
        }

        document.getElementById('winner-text').innerText = message;

        // Generate and display report
        this.generateReport();
    }

    generateReport() {
        // Create report container
        const reportDiv = document.createElement('div');
        reportDiv.id = 'game-report';
        reportDiv.style.cssText = `
            max-width: 800px;
            max-height: 70vh;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            margin: 20px auto;
            color: white;
        `;

        // Title
        const title = document.createElement('h2');
        title.innerText = '📊 游戲統計報表';
        title.style.textAlign = 'center';
        title.style.color = '#FFD700';
        reportDiv.appendChild(title);

        // Territory trend chart
        this.generateTerritoryChart(reportDiv);

        // Event timeline
        this.generateEventTimeline(reportDiv);

        // Append to game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.appendChild(reportDiv);
    }

    generateTerritoryChart(container) {
        const chartSection = document.createElement('div');
        chartSection.style.marginBottom = '30px';

        const chartTitle = document.createElement('h3');
        chartTitle.innerText = '📈 領土變化趨勢';
        chartTitle.style.color = '#4169E1';
        chartSection.appendChild(chartTitle);

        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = 760;
        canvas.height = 300;
        canvas.style.background = 'rgba(255, 255, 255, 0.1)';
        canvas.style.borderRadius = '5px';
        chartSection.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // Draw chart
        if (this.territoryHistory.length > 0) {
            const padding = 40;
            const chartWidth = canvas.width - padding * 2;
            const chartHeight = canvas.height - padding * 2;

            // Find max territory value
            let maxTerritory = 0;
            this.territoryHistory.forEach(snapshot => {
                Object.values(snapshot.territories).forEach(value => {
                    maxTerritory = Math.max(maxTerritory, value);
                });
            });
            maxTerritory = Math.max(maxTerritory, 100); // Min scale

            // Draw grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding + (chartHeight / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();

                // Y-axis labels
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                const value = Math.floor(maxTerritory * (1 - i / 5));
                ctx.fillText(value.toString(), padding - 5, y + 4);
            }

            // Draw lines for each faction
            const factions = {};
            this.snakes.forEach(snake => {
                const key = snake.faction.name;
                factions[FACTIONS[snake.originalFactionKey].name] = {
                    color: FACTIONS[snake.originalFactionKey].color,
                    data: []
                };
            });

            // Collect data points
            this.territoryHistory.forEach((snapshot, index) => {
                Object.keys(factions).forEach(factionName => {
                    const baseNames = Object.keys(snapshot.territories);
                    // Find matching faction (handling PLA suffix)
                    let territory = 0;
                    baseNames.forEach(name => {
                        if (name === factionName || name.startsWith(factionName)) {
                            territory = snapshot.territories[name] || 0;
                        }
                    });
                    factions[factionName].data.push({
                        x: padding + (chartWidth / Math.max(this.territoryHistory.length - 1, 1)) * index,
                        y: padding + chartHeight - (territory / maxTerritory) * chartHeight,
                        value: territory
                    });
                });
            });

            // Draw faction lines
            Object.keys(factions).forEach(factionName => {
                const faction = factions[factionName];
                ctx.strokeStyle = faction.color;
                ctx.lineWidth = 3;
                ctx.beginPath();

                faction.data.forEach((point, index) => {
                    if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                });
                ctx.stroke();

                // Draw dots at data points
                ctx.fillStyle = faction.color;
                faction.data.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            // X-axis labels (time)
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            [0, 0.25, 0.5, 0.75, 1].forEach(fraction => {
                const x = padding + chartWidth * fraction;
                const index = Math.floor((this.territoryHistory.length - 1) * fraction);
                if (this.territoryHistory[index]) {
                    ctx.fillText(`${this.territoryHistory[index].time}s`, x, canvas.height - 10);
                }
            });

            // Legend
            let legendY = padding - 10;
            Object.keys(factions).forEach(factionName => {
                ctx.fillStyle = factions[factionName].color;
                ctx.fillRect(canvas.width - padding - 120, legendY, 15, 15);
                ctx.fillStyle = 'white';
                ctx.textAlign = 'left';
                ctx.fillText(factionName, canvas.width - padding - 100, legendY + 12);
                legendY += 20;
            });
        }

        container.appendChild(chartSection);
    }

    generateEventTimeline(container) {
        const timelineSection = document.createElement('div');
        timelineSection.style.marginBottom = '20px';

        const timelineTitle = document.createElement('h3');
        timelineTitle.innerText = '⚔️ 重要事件時間線';
        timelineTitle.style.color = '#DC143C';
        timelineSection.appendChild(timelineTitle);

        const timeline = document.createElement('div');
        timeline.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 5px;
            font-size: 14px;
        `;

        if (this.gameEvents.length === 0) {
            timeline.innerText = '沒有記錄到特殊事件';
        } else {
            this.gameEvents.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.style.cssText = `
                    padding: 8px;
                    margin-bottom: 5px;
                    background: rgba(255, 255, 255, 0.1);
                    border-left: 3px solid ${this.getEventColor(event.type)};
                    border-radius: 3px;
                `;

                const timeSpan = document.createElement('span');
                timeSpan.style.cssText = 'color: #FFD700; font-weight: bold; margin-right: 10px;';
                timeSpan.innerText = `[${event.time}s]`;

                const messageSpan = document.createElement('span');
                messageSpan.innerText = this.getEventMessage(event);

                eventDiv.appendChild(timeSpan);
                eventDiv.appendChild(messageSpan);
                timeline.appendChild(eventDiv);
            });
        }

        timelineSection.appendChild(timeline);
        container.appendChild(timelineSection);
    }

    getEventColor(type) {
        const colors = {
            'death': '#FFA500',
            'eliminated': '#DC143C',
            'transformation': '#FFD700',
            'restoration': '#90EE90'
        };
        return colors[type] || '#FFFFFF';
    }

    getEventMessage(event) {
        const { type, data } = event;
        switch (type) {
            case 'death':
                if (data.killedBy) {
                    return `💀 ${data.faction} 被 ${data.killedBy} 擊敗在 (${data.location.x}, ${data.location.y})，轉化為解放軍`;
                }
                return `💀 ${data.faction} 在 (${data.location.x}, ${data.location.y}) 死亡，轉化為解放軍`;
            case 'eliminated':
                if (data.killedBy) {
                    return `☠️ ${data.faction} 被 ${data.killedBy} 殲滅在 (${data.location.x}, ${data.location.y})`;
                }
                return `☠️ ${data.faction} 在 (${data.location.x}, ${data.location.y}) 被徹底淘汰`;
            case 'transformation':
                return `🔄 ${data.faction} 在 (${data.location.x}, ${data.location.y}) 變身為解放軍`;
            case 'restoration':
                return `🏛️ ${data.faction} 在 (${data.location.x}, ${data.location.y}) 恢復政府狀態`;
            default:
                return `${type}: ${JSON.stringify(data)}`;
        }
    }
}
