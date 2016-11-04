function Player(game) {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  function plural(nb, many, one) {
    return nb + " " + (nb > 1 ? many : one);
  }

  this.id = s4() + s4();
  this.name = "";
  this.ready = false;
  this.color = game.colors.pop();
  this.production_color = "red";
  this.production_rate = 0.4;
  this.production_rate_max = 0.5;
  this.salary = 8;
  this.workers = 40;
  this.workers_needed = 100;
  this.workers_actifs = 40;
  this.workers_differencial = -10;

  this.money = 2600;
  this.tiles = 1;
  this.factories = 1;
  this.bigFactories = 0;
  this.houses = 0;
  this.objects = {red: 0, orange: 0, cyan: 0, green: 0};
  this.game = game;

  this.MAX_WORKERS_FACTORIES = 100;
  this.MAX_WORKERS_BIG_FACTORIES = 200;

  this.PRICE_BUY_FIELD = 850;
  this.FIELD_VALUE = 30;
  this.PRICE_BUILD_FACTORY = 1600;
  this.PRICE_UPGRADE_FACTORY = 1600;
  this.PRICE_BUILD_HOUSES = 1000;
  this.HOUSES_VALUE = 180;
  this.PRICE_BUILD_STORE = 1200;
  this.PRICE_BUILD_LABORATORY = 2600;

  this.clonePlayer = function () { // idea is to not have "socket" in the pipe...
    return {
      id: this.id,
      name: this.name,
      ready: this.ready,
      color: this.color,
      money: this.money,
      tiles: this.tiles,
      factories: this.factories,
      objects: this.objects,
      production_color: this.production_color,
      production_rate: this.production_rate,
      production_rate_max: this.production_rate_max,
      salary: this.salary,
      workers: this.workers,
      workers_needed: this.workers_needed,
      workers_actifs: this.workers_actifs,
      workers_differencial: this.workers_differencial,
    };
  };
  this.newTurn = function () {
    this.updatePlayerInfos();
    var objects = {red: 0, orange: 0, cyan: 0, green: 0};
    var built_objects = 0;
    var running_cost = 0;
    for (i = 0; i < this.game.map.length; i++) {
      for (j = 0; j < this.game.map[i].length; j++) {
        if (this.game.map[i][j].owner == this.color) {
          if (this.game.map[i][j].isFactory()) {
            var built = Math.floor(100 * this.production_rate);
            built_objects += built;
            running_cost += built * 3;
            this.game.map[i][j].addObjects(this.production_color, built);
          }
          if (this.game.map[i][j].isBigFactory()) {
            var built = Math.floor(300 * this.production_rate);
            built_objects += built;
            running_cost += built * 2;
            this.game.map[i][j].addObjects(this.production_color, built);
          }
          for (var c in objects) {
            objects[c] += this.game.map[i][j].getObjects(c);
          }
        }
      }
    }
    this.objects = objects;
    this.money -= built_objects; // pay to make it run ! ;)
    this.money += this.houses * this.HOUSES_VALUE;
    this.money += this.tiles * this.FIELD_VALUE;

    for (var color in game.trade) {
      game.variations[color] = Math.floor(Math.random() * 11 - 5);
      game.trade[color] = Math.max(game.trade[color] + game.variations[color], 0);
    }

    var message = "It's now your turn to play. Your " + plural(this.tiles, "tiles", "tile") + " generates a revenue of " + (this.tiles * this.FIELD_VALUE) + "$. ";
    if (this.houses > 0)
      message += "And your " + plural(this.houses, "houses", "house") + " generates a revenue of " + (this.houses * this.HOUSES_VALUE) + "$. ";
    message += "And you spent " + running_cost + "$ to make your factory product " + built_objects + " objects. ";
    message += "For a grand total of " + (this.tiles * this.FIELD_VALUE + this.houses * this.HOUSES_VALUE - built_objects) + "$.";
    return message;
  };

  this.updatePlayerInfos = function () {
    this.tiles = 0;
    this.factories = 0;
    this.bigFactories = 0;
    for (i = 0; i < this.game.map.length; i++) {
      for (j = 0; j < this.game.map[i].length; j++) {
        if (this.game.map[i][j].owner == this.color) {
          this.tiles++;
          if (this.game.map[i][j].isFactory())
            this.factories++;
          if (this.game.map[i][j].isBigFactory())
            this.bigFactories++;
        }
      }
    }

    this.workers_needed = this.factories * this.MAX_WORKERS_FACTORIES + this.bigFactories * this.MAX_WORKERS_BIG_FACTORIES;
    this.workers_actifs = Math.min(this.workers_needed * this.production_rate_max, this.workers);
    this.workers_differencial = this.workers - (this.workers_needed * this.production_rate_max);
    this.production_rate = Math.round(this.workers_actifs * 100 / this.workers_needed) / 100;

    console.log("updating player informations :");
    console.log(" > has " + this.tiles + " tiles");
    console.log(" > has " + this.factories + " factories");
    console.log(" > has " + this.bigFactories + " big factories");
    console.log(" > needs " + this.workers_needed + " workers");
    console.log(" > but has " + this.workers + " workers");
    console.log(" > has set his max production rate to " + this.production_rate_max);
    console.log(" > so, a max of " + (this.workers_needed * this.production_rate_max) + " workers can work");
    console.log(" > leading to a total working workers of " + this.workers_actifs);
    console.log(" >    and a differenciel of : " + this.workers_differencial);

    console.log("   >> if the factories works, he will pay : " + (this.workers_actifs * this.salary));
  }


  this.checkMoneyForAction = function (action, option) {
    var nbOption = 0;
    if (option == "all") {
      for (i = 0; i < this.game.map.length; i++) {
        for (j = 0; j < this.game.map[i].length; j++) {
          if (this.game.map[i][j].option) nbOption++;
        }
      }
    } else {
      nbOption = 1;
    }
    switch (action) {
      case "buy-field":
        if (this.money < nbOption * this.PRICE_BUY_FIELD)
          return "Not enough money to buy " + plural(nbOption, "fields", "field") + " !";
        break;
      case "build-factory":
        if (this.money < nbOption * this.PRICE_BUILD_FACTORY)
          return "Not enough money to build " + plural(nbOption, "factories", "factory") + " !";
        break;
      case "upgrade-factory":
        if (this.money < nbOption * this.PRICE_UPGRADE_FACTORY)
          return "Not enough money to upgrade " + plural(nbOption, "factories", "factory") + " !";
        break;
      case "build-houses":
        if (this.money < nbOption * this.PRICE_BUILD_HOUSES)
          return "Not enough money to build " + plural(nbOption, "houses", "house") + " !";
        break;
      case "build-store":
        if (this.money < nbOption * this.PRICE_BUILD_STORE)
          return "Not enough money to build " + plural(nbOption, "stores", "store") + " !";
        break;
      case "build-laboratory":
        if (this.money < nbOption * this.PRICE_BUILD_LABORATORY)
          return "Not enough money to build " + plural(nbOption, "laboratories", "laboratory") + " !";
        break;
    }
    return null;
  };
  this.performAction = function (action, options) {
    for (i = 0; i < options.length; i++) {
      switch (action) {
        case "buy-field":
          this.game.map[options[i].x][options[i].y].buyField(this.color);
          this.money = this.money - this.PRICE_BUY_FIELD;
          this.tiles++;
          break;
        case "build-factory":
          this.game.map[options[i].x][options[i].y].buildFactory(this.color);
          this.money = this.money - this.PRICE_BUILD_FACTORY;
          this.factories++;
          this.game.updateWorkers();
          break;
        case "upgrade-factory":
          this.game.map[options[i].x][options[i].y].upgradeFactory(this.color);
          this.money = this.money - this.PRICE_UPGRADE_FACTORY;
          this.factories--;
          this.bigFactories++;
          this.game.updateWorkers();
          break;
        case "build-houses":
          this.game.map[options[i].x][options[i].y].buildHouses(this.color);
          this.money = this.money - this.PRICE_BUILD_HOUSES;
          this.houses++;
          this.game.updateWorkers();
          break;
        case "build-store":
          this.game.map[options[i].x][options[i].y].buildStore(this.color);
          this.money = this.money - this.PRICE_BUILD_STORE;
          break;
        case "build-laboratory":
          this.game.map[options[i].x][options[i].y].buildLaboratory(this.color);
          this.money = this.money - this.PRICE_BUILD_LABORATORY;
          break;
      }
    }
    return null;
  };
  this.getOptionsForAction = function (action) {
    var options = [];

    function addOption(o) {
      for (var k = 0; k < options.length; k++) {
        if (options[k].x == o.x && options[k].y == o.y) {
          return;
        }
      }
      options.push(o);
    };
    for (var i = 0; i < this.game.map.length; i++) {
      for (var j = 0; j < this.game.map[i].length; j++) {
        if (this.game.map[i][j].owner == this.color) {
          switch (action) {
            case "build-houses":
            case "build-store":
            case "build-laboratory":
            case "build-factory":
              if (this.game.map[i][j].type == "empty") {
                addOption({x: i, y: j});
              }
              break;
            case "upgrade-factory":
              if (this.game.map[i][j].type == "factory") {
                addOption({x: i, y: j});
              }
              break;
            case "buy-field":
              if (i > 0
                && this.game.map[i - 1][j].owner == "none") {
                addOption({x: i - 1, y: j});
              }
              if (j > 0
                && this.game.map[i][j - 1].owner == "none") {
                addOption({x: i, y: j - 1});
              }
              if (i < this.game.map.length - 1
                && this.game.map[i + 1][j].owner == "none") {
                addOption({x: i + 1, y: j});
              }
              if (j < this.game.map[i].length - 1
                && this.game.map[i][j + 1].owner == "none") {
                addOption({x: i, y: j + 1});
              }
              break;
          }
        }
      }
    }
    if (options.length < 1) {
      switch (action) {
        case "buy-field":
          return "No field can be bought !";
        case "build-factory":
          return "You need at least one free field to build a factory !";
        case "upgrade-factory":
          return "You need at least one factory to upgrade it !";
        case "build-houses":
          return "You need at least one free field to build houses !";
        case "build-store":
          return "You need at least one free field to build a store !";
        case "build-laboratory":
          return "You need at least one free field to build a laboratory !";
      }
    }
    return options;
  };
}
module.exports = Player;