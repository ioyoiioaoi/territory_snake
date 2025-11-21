class Snake {
    constructor(factionKey, ctx, map, isBot = false) {
        const faction = FACTIONS[factionKey];
        this.faction = faction;
        this.ctx = ctx;
        this.map = map;
        this.isBot = isBot;

        this.body = [];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.length = 5;
        this.alive = true;
        this.score = 0;
        this.lastMoveTime = 0;

        // Load flag image
        this.flagImage = new Image();
        this.flagImage.src = faction.flagImage;

        // Initialize body
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: faction.startPos.x - i, y: faction.startPos.y });
        }
    }

    setDirection(newDir) {
        if (this.direction.x + newDir.x === 0 && this.direction.y + newDir.y === 0) return;
        this.nextDirection = newDir;
    }

    update(allSnakes) {
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

        if (this.map.isObstacle(newHead.x, newHead.y)) {
            this.die();
            return;
        }

        for (let part of this.body) {
            if (newHead.x === part.x && newHead.y === part.y) {
                this.die();
                return;
            }
        }

        for (let otherSnake of allSnakes) {
            if (!otherSnake.alive) continue;

            if (otherSnake !== this && newHead.x === otherSnake.body[0].x && newHead.y === otherSnake.body[0].y) {
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

            for (let part of otherSnake.body) {
                if (newHead.x === part.x && newHead.y === part.y) {
                    const myPower = this.length + this.faction.attackBonus;
                    const otherPower = otherSnake.length + otherSnake.faction.attackBonus;

                    if (myPower > otherPower) {
                        const cutIndex = otherSnake.body.indexOf(part);
                        if (cutIndex !== -1) {
                            const lostLength = otherSnake.body.length - cutIndex;
                            otherSnake.body.splice(cutIndex);
                            otherSnake.length = otherSnake.body.length;
                            this.length += Math.floor(lostLength / 2);
                        }
                    } else {
                        this.die();
                        return;
                    }
                }
            }
        }

        this.body.unshift(newHead);
        this.map.updateTerritory(newHead.x, newHead.y, this.faction.id);

        const resource = this.map.checkResourceCollision(newHead.x, newHead.y);
        if (resource) {
            this.length += (resource.value * this.faction.growthRate);
            this.score += resource.value * 10;
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

    die() {
        this.alive = false;
    }

    draw() {
        if (!this.alive) return;

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
    }
}
