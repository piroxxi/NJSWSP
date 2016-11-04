function Tile() {
  this.type = "empty";
  this.owner = "none";
  this.option = null;
  this.data = {};

  this.buyField = function (owner) {
    this.owner = owner;
  }

  this.buildFactory = function (owner) {
    this.type = "factory";
    this.owner = owner;
    if (typeof this.data.objects == "undefined")
      this.data.objects = {red: 0, orange: 0, cyan: 0, green: 0}
  }
  this.isFactory = function () {
    return this.type == "factory";
  }

  this.upgradeFactory = function (owner) {
    this.type = "big-factory";
    this.owner = owner;
    if (typeof this.data.objects == "undefined")
      this.data.objects = {red: 0, orange: 0, cyan: 0, green: 0}
  }
  this.isBigFactory = function () {
    return this.type == "big-factory";
  }

  this.addObjects = function (color, number) {
    if (typeof this.data.objects == "undefined")
      this.data.objects = {red: 0, orange: 0, cyan: 0, green: 0}
    this.data.objects[color] += number;
  }
  this.getObjects = function (color) {
    if (typeof this.data.objects == "undefined")
      this.data.objects = {red: 0, orange: 0, cyan: 0, green: 0}
    return this.data.objects[color];
  }

  this.buildHouses = function (owner) {
    this.type = "houses";
    this.owner = owner;
    delete this.data.objects;
  }
  this.isHouses = function () {
    return this.type == "houses";
  }

  this.buildStore = function (owner) {
    this.type = "store";
    this.owner = owner;
    delete this.data.objects;
  }
  this.isStore = function () {
    return this.type == "store";
  }

  this.buildLaboratory = function (owner) {
    this.type = "laboratory";
    this.owner = owner;
    delete this.data.objects;
  }
  this.isLaboratory = function () {
    return this.type == "laboratory";
  }
}
module.exports = Tile;