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
    GRAIN: {
        emoji: '🌾',
        value: 2,
        name: '糧食',
        effect: 'grow'
    },
    INDUSTRY: {
        emoji: '⚙️',
        value: 4,
        name: '工業',
        effect: 'grow'
    },
    CITY: {
        emoji: '🏙️',
        value: 10,
        name: '重要城市',
        effect: 'grow'
    },
    RESOURCE: {
        emoji: '💎',
        value: 6,
        name: '礦產',
        effect: 'grow'
    },
    RAILWAY: {
        emoji: '🚂',
        value: 4,
        name: '鐵路',
        effect: 'speed'
    },
    SWORD: {
        emoji: '⚔️',
        value: 0,
        name: '無敵',
        effect: 'invincible'
    },
    GOVERNMENT: {
        emoji: '🏛️',
        value: 10,
        name: '政府',
        effect: 'restore'
    }
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

const TAIWAN_OCEAN_ZONE = {
    xMin: 32,
    xMax: 39,
    yMin: 20,
    yMax: 29
};

const JAPAN_KOREA_SEA_ZONE = {
    xMin: 35,
    xMax: 39,
    yMin: 0,
    yMax: 15
};

// Teleport spawn points for Japan invincibility
const TELEPORT_LOCATIONS = [
    { x: 32, y: 22, name: '台灣' },  // Taiwan
    { x: 38, y: 8, name: '日本' },   // Japan area
    { x: 36, y: 3, name: '韓國' }    // Korea area
];

