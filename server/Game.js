var Player = require("./Player.js");
var Tile = require("./Tile.js");
function Game() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  this.id = s4() + s4();
  this.players = [];
  this.colors = ["green", "yellow", "pink", "blue"];
  this.started = false;
  this.current_player = -1;
  this.trade = {
    red: 20 + Math.floor(Math.random() * 11 - 5) * 2,
    orange: 60 + Math.floor(Math.random() * 11 - 5) * 3,
    cyan: 120 + Math.floor(Math.random() * 11 - 5) * 4,
    green: 240 + Math.floor(Math.random() * 11 - 5) * 5,
  };
  this.variations = {red: 0, orange: 0, cyan: 0, green: 0};

  this.INITIAL_WORKERS_PER_PLAYER = 40;
  this.WORKERS_PER_HOUSES = 30;
  this.WORKERS_BALANCER = 100;

  this.newPlayer = function () {
    if (this.colors.length == 0) return null;
    var player = new Player(this);
    this.players.push(player);
    return player;
  };
  this.getPlayer = function (id) {
    for (i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id)
        return this.players[i];
    }
    return null;
  };
  this.removePlayer = function (id) {
    var index = -1;
    for (i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        index = i;
        this.colors.push(this.players[i].color);
      }
    }
    if (index == -1) return false;
    this.players.splice(index, 1);
    return true;
  };
  this.clonePlayers = function () {
    var players = [];
    for (i = 0; i < this.players.length; i++) {
      players.push(this.players[i].clonePlayer());
    }
    return players;
  };
  this.isFull = function () {
    return this.players.length >= 4;
  };
  this.allPlayersReady = function () {
    for (var i = 0; i < this.players.length; i++) {
      if (!this.players[i].ready) return false;
    }
    return true;
  };
  this.getFirstPlayer = function () {
    this.first_player = Math.floor(Math.random() * this.players.length);
    this.current_player = this.first_player;
    return this.first_player;
  };
  this.getNextPlayer = function () {
    this.current_player = ((this.current_player + 1) % this.players.length);
    return this.current_player;
  };
  this.startGame = function () {
    this.started = true;
    if (typeof this.map == "undefined") this.generateMap();
  };
  this.generateMap = function () {
    this.map = [];
    this.workers = this.INITIAL_WORKERS_PER_PLAYER * this.players.length;
    for (i = 0; i < 6; i++) {
      var line = [];
      for (j = 0; j < 6; j++) {
        line.push(new Tile());
      }
      this.map.push(line);
    }
    this.map[0][0].buildFactory(this.players[0].color);
    this.map[5][5].buildFactory(this.players[1].color);

    if (this.players.length > 2)
      this.map[0][5].buildFactory(this.players[2].color);

    if (this.players.length > 3)
      this.map[5][0].buildFactory(this.players[3].color);
  };

  /**
   * @param String : the options id
   * @returns An array of coordinates (x:y) of all options
   */
  this.getOptions = function (option) {
    var options = [];
    for (var i = 0; i < this.map.length; i++) {
      for (var j = 0; j < this.map[i].length; j++) {
        if (this.map[i][j].option && (option === "all" || this.map[i][j].option == option)) {
          options.push({x: i, y: j});
        }
      }
    }
    return options;
  };

  /**
   *
   */
  this.resetOptions = function () {
    for (var i = 0; i < this.map.length; i++) {
      for (var j = 0; j < this.map[i].length; j++) {
        this.map[i][j].option = null;
      }
    }
  };

  this.updateWorkers = function () {
    console.log("nouvelle répartition des travailleurs");
    this.workers = this.INITIAL_WORKERS_PER_PLAYER * this.players.length;
    for (var i = 0; i < this.map.length; i++) {
      for (var j = 0; j < this.map[i].length; j++) {
        if (this.map[i][j].isHouses())
          this.workers += this.WORKERS_PER_HOUSES;
      }
    }
    var total_salaries = 0;
    for (var k = 0; k < this.players.length; k++) {
      var p = this.players[k];
      total_salaries += this.WORKERS_BALANCER + (p.factories * p.MAX_WORKERS_FACTORIES + p.bigFactories * p.MAX_WORKERS_BIG_FACTORIES) * p.salary;
    }
    for (var k = 0; k < this.players.length; k++) {
      var p = this.players[k];
      var salaries = this.WORKERS_BALANCER + (p.factories * p.MAX_WORKERS_FACTORIES + p.bigFactories * p.MAX_WORKERS_BIG_FACTORIES) * p.salary;
      p.workers = Math.round(this.workers * salaries / total_salaries);
      console.log("  > player " + p.name + " has " + p.workers);
    }
  }
}
module.exports = Game;