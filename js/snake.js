class Snake {
    constructor(factionKey, ctx, map, game, isBot = false) {
        // Deep clone faction to avoid modifying global state
        const factionData = FACTIONS[factionKey];
        this.faction = JSON.parse(JSON.stringify(factionData));

        this.ctx = ctx;
        this.map = map;
        this.game = game; // Store game instance
        this.isBot = isBot;

        this.body = [];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.length = 5;
        this.alive = true;
        this.score = 0;
        this.lastMoveTime = 0;
        this.invincibleUntil = 0; // Timestamp for invincibility
        this.speedDebuffs = []; // Array of { factor, endTime }
        this.isPLA = false;
        this.originalFactionKey = factionKey; // Store original faction key
        this.lastAutoGrowTime = 0; // For ROC auto-growth
        this.lastJapanBuffTime = 0; // For Japan periodic invincibility

        // Load flag image
        this.flagImage = new Image();
        this.flagImage.src = this.faction.flagImage;

        // Initialize body
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: this.faction.startPos.x - i, y: this.faction.startPos.y });
        }
    }

    transformToPLA() {
        this.isPLA = true;
        this.faction.name = this.faction.name + " (解放軍)";
        this.faction.flagImage = "images/flag_pla.png";
        this.faction.speed /= 2; // Double speed (half interval)

        // Reload flag image
        this.flagImage.src = this.faction.flagImage;

        // Respawn logic
        this.body = [];
        this.length = 5; // Reset length to avoid instant death loops
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;

        // Reset position to start
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: this.faction.startPos.x - i, y: this.faction.startPos.y });
        }

        // Notify game
        if (this.game && this.game.showNotification) {
            this.game.showNotification("解放軍出現！");
        }
        console.log("Transformed to PLA!");
    }

    restoreFromPLA() {
        if (!this.isPLA) return;

        this.isPLA = false;

        // Restore original faction data
        const originalFaction = FACTIONS[this.originalFactionKey];
        this.faction.name = originalFaction.name;
        this.faction.flagImage = originalFaction.flagImage;
        this.faction.speed = originalFaction.speed;

        // Reload flag image
        this.flagImage.src = this.faction.flagImage;

        // Notify game
        if (this.game && this.game.showNotification) {
            this.game.showNotification("恢復政府！");
        }
        console.log("Restored from PLA!");
    }

    die() {
        if (!this.isPLA) {
            this.transformToPLA();
        } else {
            this.alive = false;
        }
    }

    getSpeed(currentTime) {
        // Remove expired debuffs
        this.speedDebuffs = this.speedDebuffs.filter(d => d.endTime > currentTime);

        // Calculate total slow factor
        let totalFactor = 0;
        this.speedDebuffs.forEach(d => totalFactor += d.factor);

        // Base speed (ms per tick) * (1 + slow factor)
        // Higher value = slower movement
        return this.faction.speed * (1 + totalFactor);
    }

    addDebuff(factor, duration, currentTime) {
        // Check if a similar debuff already exists to avoid stacking too aggressively
        const existing = this.speedDebuffs.find(d => d.factor === factor && d.endTime > currentTime);
        if (existing) {
            existing.endTime = Math.max(existing.endTime, currentTime + duration);
        } else {
            this.speedDebuffs.push({ factor, endTime: currentTime + duration });
        }
    }

    setDirection(newDir) {
        if (this.direction.x + newDir.x === 0 && this.direction.y + newDir.y === 0) return;
        this.nextDirection = newDir;
    }

    update(allSnakes, currentTime) {
        // ROC auto-growth: grow 1 length per second
        if (this.originalFactionKey === 'ROC' && this.alive) {
            if (currentTime - this.lastAutoGrowTime >= 1000) {
                this.length += 1;
                this.lastAutoGrowTime = currentTime;
            }
        }

        // Japan periodic invincibility: every 20 seconds
        if (this.originalFactionKey === 'JAPAN' && this.alive) {
            if (currentTime - this.lastJapanBuffTime >= 20000) {
                this.invincibleUntil = currentTime + 5000; // 5 seconds invincibility
                this.lastJapanBuffTime = currentTime;

                // Teleport to random location (Taiwan, Japan, or Korea)
                const teleportLocation = TELEPORT_LOCATIONS[Math.floor(Math.random() * TELEPORT_LOCATIONS.length)];
                this.body = [];
                this.direction = DIRECTIONS.RIGHT;
                this.nextDirection = DIRECTIONS.RIGHT;
                for (let i = 0; i < this.length; i++) {
                    this.body.push({ x: teleportLocation.x - i, y: teleportLocation.y });
                }

                if (this.game && this.game.showNotification) {
                    this.game.showNotification(`日本獲得無敵狀態！傳送至${teleportLocation.name}`);
                }
            }
        }
        if (!this.alive) return;

        if (this.isBot) {
            this.decideMove(allSnakes);
        }

        this.direction = this.nextDirection;
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Wall wrapping (teleport to opposite side)
        if (newHead.x < 0) newHead.x = MAP_WIDTH - 1;
        if (newHead.x >= MAP_WIDTH) newHead.x = 0;
        if (newHead.y < 0) newHead.y = MAP_HEIGHT - 1;
        if (newHead.y >= MAP_HEIGHT) newHead.y = 0;

        // Map Zone Check (Taiwan Ocean)
        if (newHead.x >= TAIWAN_OCEAN_ZONE.xMin && newHead.x <= TAIWAN_OCEAN_ZONE.xMax &&
            newHead.y >= TAIWAN_OCEAN_ZONE.yMin && newHead.y <= TAIWAN_OCEAN_ZONE.yMax) {
            this.addDebuff(0.5, 2000, currentTime); // 50% slow for 2 seconds (refreshes while in zone)
        }

        // Map Zone Check (Japan/Korea Sea) - Japan is immune
        if (this.originalFactionKey !== 'JAPAN') {
            if (newHead.x >= JAPAN_KOREA_SEA_ZONE.xMin && newHead.x <= JAPAN_KOREA_SEA_ZONE.xMax &&
                newHead.y >= JAPAN_KOREA_SEA_ZONE.yMin && newHead.y <= JAPAN_KOREA_SEA_ZONE.yMax) {
                this.addDebuff(0.1, 2000, currentTime); // 10% slow for 2 seconds
            }
        }

        if (this.map.isObstacle(newHead.x, newHead.y)) {
            this.die();
            return;
        }

        // Self collision
        for (let part of this.body) {
            if (newHead.x === part.x && newHead.y === part.y) {
                // Japan Buff: Immune to self-collision
                if (this.faction.id !== FACTIONS.JAPAN.id) {
                    this.die();
                }
                return;
            }
        }

        const isInvincible = currentTime < this.invincibleUntil;

        for (let otherSnake of allSnakes) {
            if (!otherSnake.alive) continue;

            const otherIsInvincible = currentTime < otherSnake.invincibleUntil;

            // Head-to-Head Collision
            if (otherSnake !== this && newHead.x === otherSnake.body[0].x && newHead.y === otherSnake.body[0].y) {
                if (isInvincible && !otherIsInvincible) {
                    otherSnake.die();
                    this.length += Math.floor(otherSnake.length / 2);
                } else if (!isInvincible && otherIsInvincible) {
                    this.die();
                    otherSnake.length += Math.floor(this.length / 2);
                    return;
                } else {
                    // Both normal or both invincible: Compare power
                    const myPower = this.length + this.faction.attackBonus;
                    const otherPower = otherSnake.length + otherSnake.faction.attackBonus;

                    if (myPower > otherPower) {
                        otherSnake.die();
                        this.length += Math.floor(otherSnake.length / 2);
                    } else if (myPower < otherPower) {
                        this.die();
                        otherSnake.length += Math.floor(this.length / 2);
                        return;
                    } else {
                        this.die();
                        otherSnake.die();
                        return;
                    }
                }
            }

            // Head-to-Body Collision
            for (let part of otherSnake.body) {
                if (newHead.x === part.x && newHead.y === part.y) {
                    if (otherIsInvincible) {
                        this.die(); // Die if hitting invincible snake
                        return;
                    } else {
                        // Survival Rule: Lose length instead of dying
                        const penalty = 5; // Lose 5 length

                        if (this.length <= 1) {
                            // Critical Survival: Don't die, just slow down
                            this.addDebuff(0.1, 5000, currentTime); // 10% slow for 5 seconds
                            // Don't return, continue moving
                        } else {
                            this.length = Math.max(1, this.length - penalty);

                            // Cut opponent
                            const cutIndex = otherSnake.body.indexOf(part);
                            if (cutIndex !== -1) {
                                const lostLength = otherSnake.body.length - cutIndex;
                                otherSnake.body.splice(cutIndex);
                                otherSnake.length = otherSnake.body.length;
                            }
                        }
                    }
                }
            }
        }

        this.body.unshift(newHead);
        this.map.updateTerritory(newHead.x, newHead.y, this.faction.id);

        const resource = this.map.checkResourceCollision(newHead.x, newHead.y);
        if (resource) {
            if (resource.effect === 'invincible') {
                this.invincibleUntil = currentTime + 5000; // 5 seconds invincibility
            } else if (resource.effect === 'restore') {
                // Government symbol: restore from PLA and add 10 length
                this.restoreFromPLA();
                this.length += 10;
                this.score += resource.value * 10;
            } else {
                this.length += (resource.value * this.faction.growthRate);
                this.score += resource.value * 10;
            }
        }

        while (this.body.length > this.length) {
            this.body.pop();
        }
    }

    decideMove(allSnakes) {
        let target = null;
        let minDist = Infinity;
        const head = this.body[0];

        this.map.resources.forEach(res => {
            const dist = Math.abs(res.x - head.x) + Math.abs(res.y - head.y);
            if (dist < minDist) {
                minDist = dist;
                target = res;
            }
        });

        if (!target) {
            target = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
        }

        const possibleMoves = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        let bestMove = this.direction;
        let bestScore = -Infinity;

        possibleMoves.forEach(move => {
            if (move.x + this.direction.x === 0 && move.y + this.direction.y === 0) return;

            const nextX = head.x + move.x;
            const nextY = head.y + move.y;

            if (nextX < 0 || nextX >= MAP_WIDTH || nextY < 0 || nextY >= MAP_HEIGHT) return;
            if (this.map.isObstacle(nextX, nextY)) return;

            let collision = false;
            for (let s of allSnakes) {
                if (!s.alive) continue;
                for (let part of s.body) {
                    if (nextX === part.x && nextY === part.y) {
                        collision = true;
                        break;
                    }
                }
                if (collision) break;
            }
            if (collision) return;

            let score = 0;
            const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
            score -= dist;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });

        this.nextDirection = bestMove;
    }

    draw() {
        if (!this.alive) return;

        // Flashing effect if invincible
        if (this.invincibleUntil > performance.now()) {
            if (Math.floor(performance.now() / 100) % 2 === 0) {
                this.ctx.globalAlpha = 0.5;
            }
        }

        this.ctx.fillStyle = this.faction.color;
        this.body.forEach((part, index) => {
            this.ctx.fillRect(part.x * TILE_SIZE, part.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (index === 0 && this.flagImage.complete) {
                this.ctx.drawImage(
                    this.flagImage,
                    part.x * TILE_SIZE + 2,
                    part.y * TILE_SIZE + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
            }
        });

        this.ctx.globalAlpha = 1.0; // Reset alpha
    }
}
