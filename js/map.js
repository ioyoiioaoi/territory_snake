class GameMap {
    constructor(ctx) {
        this.ctx = ctx;
        this.grid = [];
        this.visitedBy = []; // Track which factions visited each tile
        this.resources = [];
        this.initGrid();
    }

    initGrid() {
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.grid[x] = [];
            this.visitedBy[x] = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                this.grid[x][y] = 0;
                this.visitedBy[x][y] = new Set(); // Set of faction IDs that visited this tile
            }
        }
    }

    updateTerritory(x, y, factionId) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            this.grid[x][y] = factionId;

            // Track visitation
            this.visitedBy[x][y].add(factionId);

            // Check if all 3 factions have visited this tile
            if (this.visitedBy[x][y].size === 3) {
                // Spawn government symbol if not already a resource here
                const hasResource = this.resources.some(r => r.x === x && r.y === y);
                if (!hasResource) {
                    this.resources.push({
                        x,
                        y,
                        type: RESOURCE_TYPES.GOVERNMENT,
                        activationCount: 0  // Needs to be stepped on twice
                    });
                }
            }
        }
    }

    spawnResource() {
        const x = getRandomInt(0, MAP_WIDTH - 1);
        const y = getRandomInt(0, MAP_HEIGHT - 1);

        const rand = Math.random();
        let type;

        if (rand > 0.95) {
            type = RESOURCE_TYPES.SWORD; // 5% sword
        } else if (rand > 0.87) {
            type = RESOURCE_TYPES.CITY; // 8% city
        } else if (rand > 0.77) {
            type = RESOURCE_TYPES.RESOURCE; // 10% mineral
        } else if (rand > 0.62) {
            type = RESOURCE_TYPES.RAILWAY; // 15% railway
        } else if (rand > 0.40) {
            type = RESOURCE_TYPES.INDUSTRY; // 22% industry
        } else {
            type = RESOURCE_TYPES.GRAIN; // 40% grain
        }
        // Note: GOVERNMENT type is NOT randomly spawned, only appears on tiles visited by all 3 factions

        this.resources.push({ x, y, type });
    }

    isObstacle(x, y) {
        return false;
    }

    draw() {
        // Draw territory
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const owner = this.grid[x][y];
                if (owner !== 0) {
                    const faction = getFactionById(owner);
                    this.ctx.fillStyle = faction.color;
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    this.ctx.globalAlpha = 1.0;
                }
            }
        }

        // Draw resources
        this.resources.forEach(res => {
            this.ctx.font = `${TILE_SIZE - 2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                res.type.emoji,
                res.x * TILE_SIZE + TILE_SIZE / 2,
                res.y * TILE_SIZE + TILE_SIZE / 2
            );
        });
    }

    checkResourceCollision(headX, headY) {
        for (let i = 0; i < this.resources.length; i++) {
            const res = this.resources[i];
            if (res.x === headX && res.y === headY) {
                // Special handling for government symbols
                if (res.type.effect === 'restore') {
                    if (res.activationCount === undefined || res.activationCount < 1) {
                        // First step: activate but don't collect
                        res.activationCount = (res.activationCount || 0) + 1;
                        return null; // Not collected yet
                    }
                    // Second step: can be collected
                }

                // Collect the resource
                this.resources.splice(i, 1);
                return res.type;
            }
        }
        return null;
    }

    getTerritoryCount(factionId) {
        let count = 0;
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (this.grid[x][y] === factionId) count++;
            }
        }
        return count;
    }
}
