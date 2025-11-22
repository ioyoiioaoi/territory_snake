function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Convert coordinates to city/region name
function getLocationName(x, y) {
    // Check all regions, prioritize smaller/more specific regions
    const matchingRegions = MAP_REGIONS.filter(region =>
        x >= region.xMin && x <= region.xMax &&
        y >= region.yMin && y <= region.yMax
    );

    if (matchingRegions.length === 0) {
        return `未知區域`;
    }

    // If multiple regions match, choose the smallest one (most specific)
    matchingRegions.sort((a, b) => {
        const areaA = (a.xMax - a.xMin) * (a.yMax - a.yMin);
        const areaB = (b.xMax - b.xMin) * (b.yMax - b.yMin);
        return areaA - areaB;
    });

    return matchingRegions[0].name;
}

function checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y);
}

function getFactionById(id) {
    for (let key in FACTIONS) {
        if (FACTIONS[key].id === id) return FACTIONS[key];
    }
    return null;
}
