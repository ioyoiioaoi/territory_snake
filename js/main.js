let game;

window.onload = () => {
    game = new Game('gameCanvas');
};

function startGame(factionKey) {
    if (game) {
        game.start(factionKey);
    }
}
