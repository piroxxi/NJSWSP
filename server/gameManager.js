var Game = require("./Game.js");
module.exports = {
  games: new Array(),
  newGame: function () {
    var game = new Game();
    this.games.push(game);
    return game;
  },
  getGame: function (id) {
    for (i = 0; i < this.games.length; i++) {
      if (this.games[i].id === id)
        return this.games[i];
    }
    return null;
  }
};