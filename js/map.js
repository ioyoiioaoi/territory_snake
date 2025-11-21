class GameMap {
    constructor(ctx) {
        this.ctx = ctx;
        this.grid = [];
        this.resources = [];
        this.initGrid();
    }

    initGrid() {
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.grid[x] = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                this.grid[x][y] = 0;
            }
        }
    }

    updateTerritory(x, y, factionId) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            this.grid[x][y] = factionId;
        }
    }

    spawnResource() {
        const x = getRandomInt(0, MAP_WIDTH - 1);
        const y = getRandomInt(0, MAP_HEIGHT - 1);

        const rand = Math.random();
        let type = RESOURCE_TYPES.FOOD;
        if (rand > 0.9) type = RESOURCE_TYPES.CITY;
        else if (rand > 0.8) type = RESOURCE_TYPES.AMMO;

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
            this.ctx.fillStyle = res.type.color;
            this.ctx.fillRect(res.x * TILE_SIZE, res.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
    }

    checkResourceCollision(headX, headY) {
        for (let i = 0; i < this.resources.length; i++) {
            const res = this.resources[i];
            if (res.x === headX && res.y === headY) {
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
