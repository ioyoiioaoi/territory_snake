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

// Map regions with city names (approximating Chinese geography on 40x30 grid)
const MAP_REGIONS = [
    // Northeast
    { name: '瀋陽', xMin: 28, xMax: 35, yMin: 0, yMax: 7 },
    { name: '哈爾濱', xMin: 30, xMax: 39, yMin: 0, yMax: 5 },
    { name: '長春', xMin: 28, xMax: 35, yMin: 3, yMax: 9 },

    // North
    { name: '北京', xMin: 20, xMax: 28, yMin: 5, yMax: 12 },
    { name: '天津', xMin: 22, xMax: 28, yMin: 8, yMax: 13 },
    { name: '內蒙古', xMin: 12, xMax: 25, yMin: 0, yMax: 10 },

    // Northwest
    { name: '西安', xMin: 12, xMax: 20, yMin: 10, yMax: 17 },
    { name: '蘭州', xMin: 8, xMax: 16, yMin: 8, yMax: 15 },
    { name: '新疆', xMin: 0, xMax: 10, yMin: 0, yMax: 15 },

    // Central
    { name: '南京', xMin: 20, xMax: 28, yMin: 13, yMax: 19 },
    { name: '上海', xMin: 26, xMax: 32, yMin: 14, yMax: 20 },
    { name: '武漢', xMin: 16, xMax: 24, yMin: 14, yMax: 20 },
    { name: '重慶', xMin: 10, xMax: 18, yMin: 15, yMax: 22 },

    // Southwest
    { name: '成都', xMin: 8, xMax: 16, yMin: 16, yMax: 23 },
    { name: '昆明', xMin: 6, xMax: 14, yMin: 20, yMax: 27 },
    { name: '西藏', xMin: 0, xMax: 10, yMin: 16, yMax: 29 },

    // South
    { name: '廣州', xMin: 14, xMax: 22, yMin: 22, yMax: 29 },
    { name: '深圳', xMin: 18, xMax: 24, yMin: 25, yMax: 29 },
    { name: '福建', xMin: 22, xMax: 30, yMin: 20, yMax: 27 },

    // East Coast
    { name: '青島', xMin: 24, xMax: 30, yMin: 10, yMax: 16 },
    { name: '杭州', xMin: 24, xMax: 30, yMin: 16, yMax: 21 },

    // Taiwan area
    { name: '台灣', xMin: 30, xMax: 39, yMin: 20, yMax: 29 },

    // Far East (Japan/Korea)
    { name: '韓國', xMin: 34, xMax: 39, yMin: 0, yMax: 10 },
    { name: '日本海域', xMin: 35, xMax: 39, yMin: 8, yMax: 19 }
];

