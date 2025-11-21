const TILE_SIZE = 20; // Doubled from 10px
const MAP_WIDTH = 40; // 800px / 20
const MAP_HEIGHT = 30; // 600px / 20
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const FACTIONS = {
    MANCHUKUO: {
        id: 1,
        name: '滿洲國',
        player: '玩家一',
        color: '#FFD700', // Gold
        flagImage: 'images/flag_manchukuo.png',
        startPos: { x: 30, y: 5 }, // NE (Shenyang approx)
        speed: 100, // ms per tick - faster!
        growthRate: 1,
        attackBonus: 0
    },
    ROC: {
        id: 2,
        name: '中華民國',
        player: '玩家二',
        color: '#4169E1', // Royal Blue
        flagImage: 'images/flag_roc.png',
        startPos: { x: 20, y: 15 }, // Central (Nanjing approx)
        speed: 150, // ms per tick (slower)
        growthRate: 2, // Grows faster
        attackBonus: 0
    },
    JAPAN: {
        id: 3,
        name: '日本',
        player: '玩家三',
        color: '#DC143C', // Crimson
        flagImage: 'images/flag_japan.png',
        startPos: { x: 35, y: 12 }, // East Coast (Qingdao/Korea approx)
        speed: 150, // ms per tick (slower)
        growthRate: 1,
        attackBonus: 1 // Wins ties
    }
};

const RESOURCE_TYPES = {
    FOOD: { color: '#00FF00', value: 1 },
    AMMO: { color: '#FF0000', value: 0 }, // Used for combat buff?
    CITY: { color: '#FFFF00', value: 5 }
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};
