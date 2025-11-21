let game;

window.onload = () => {
    game = new Game('gameCanvas');

    // Setup start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', showFactionSelect);
    }
};

function startGame(factionKey) {
    if (game) {
        game.start(factionKey);
    }
}

function showFactionSelect() {
    document.getElementById('rules-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}
