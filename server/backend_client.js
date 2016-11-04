var io;
module.exports = function (app, server, io, gameManager) {
  var clients = io.of('/client');
  clients.on('connection', function (socket) {
    var q = socket.handshake.query;
    console.log("new client connection (game=" + q.game_id + ",player=" + q.player_id + ")");
    var game = gameManager.getGame(q.game_id);
    if (!game) {
      console.log(" >> game does not exists !");
      socket.emit("_error", {
        "type": "unexisting_game",
        "message": "Unnable to reach game " + q.game_id + "!"
      })
      return;
    }

    var player = game.getPlayer(q.player_id);
    if (!player) {
      console.log(" >> player does not exists !");
      socket.emit("_error", {
        "type": "unexisting_player",
        "message": "Unexisting player " + q.player_id + "!"
      })
      return;
    }
    player.player_socket = socket;

    game.game_socket.emit("update_players", game.clonePlayers());
    socket.on("disconnect", function () {
      game.started = false;
      game.removePlayer(player.id);
      game.game_socket.emit("update_players", game.clonePlayers());
    });

    socket.on("set_player_name", function (data, callback) {
      for (i = 0; i < game.players.length; i++) {
        if (game.players[i].name === data.player_name) {
          callback({status: "error", message: "Name already taken"});
          return;
        }
      }
      player.name = data.player_name;
      game.game_socket.emit("update_players", game.clonePlayers());
      callback({status: "success"});
    });
    socket.on("player_ready", function () {
      player.ready = true;
      game.game_socket.emit("update_players", game.clonePlayers());
      if (game.players.length > 1 && game.allPlayersReady()) {
        game.startGame();
        var first_player = game.players[game.getFirstPlayer()];
        var message = first_player.newTurn();

        // notify everyone
        clients.emit("game_started");
        first_player.player_socket.emit("turn_start", {player: first_player.clonePlayer(), message: message});
        game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
        game.game_socket.emit("update_players", game.clonePlayers());
        game.game_socket.emit("new_turn", first_player.clonePlayer());
      }
    });

    socket.on("buy-field", function (data, callback) {
      handleAction(game, player, "buy-field", data, callback);
    });
    socket.on("build-factory", function (data, callback) {
      handleAction(game, player, "build-factory", data, callback);
    });
    socket.on("upgrade-factory", function (data, callback) {
      handleAction(game, player, "upgrade-factory", data, callback);
    });
    socket.on("build-houses", function (data, callback) {
      handleAction(game, player, "build-houses", data, callback);
    });
    socket.on("build-store", function (data, callback) {
      handleAction(game, player, "build-store", data, callback);
    });
    socket.on("build-laboratory", function (data, callback) {
      handleAction(game, player, "build-laboratory", data, callback);
    });

    socket.on("change-production-rate", function (data, callback) {
      player.production_rate_max = data.rate;
      player.updatePlayerInfos();
      game.game_socket.emit("update_players", game.clonePlayers());
      callback({status: "succes", player: player.clonePlayer()});
    });
    socket.on("change-salary", function (data, callback) {
      player.salary = data.salary;
      game.updateWorkers();
      player.updatePlayerInfos();
      game.game_socket.emit("update_players", game.clonePlayers());
      callback({status: "succes", player: player.clonePlayer()});
    });
    socket.on("change-factory-production", function (data, callback) {
      var error = player.checkMoneyForAction("change-factory-production", data.option);
      if (error) {
        return callback({status: "error", message: error});
      }
      player.production_color = data.color;
      player.money = player.money - 80;
      game.game_socket.emit("update_players", game.clonePlayers());
      callback({status: "succes", player: player.clonePlayer()});
    });
    socket.on("sell-production", function (data, callback) {
      if (typeof data.color == "undefined" || player.objects[data.color] == 0)
        callback({status: "error", message: error});

      // update
      player.money = player.money + player.objects[data.color] * game.trade[data.color];

      // cleanup
      player.objects[data.color] = 0;
      for (i = 0; i < game.map.length; i++) {
        for (j = 0; j < game.map[i].length; j++) {
          if (game.map[i][j].owner == player.color &&
            (game.map[i][j].type == "factory" || game.map[i][j].type == "big-factory" )) {
            game.map[i][j].data.objects[data.color] = 0;
          }else{
            delete game.map[i][j].data.objects;
          }
        }
      }
      game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
      game.game_socket.emit("update_players", game.clonePlayers());
      callback({status: "succes", player: player.clonePlayer()});
    });

    socket.on("turn_ended", function () {
      var next_player = game.players[game.getNextPlayer()];
      var message = next_player.newTurn();
      next_player.player_socket.emit("turn_start", {player: next_player.clonePlayer(), message: message});
      game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
      game.game_socket.emit("update_players", game.clonePlayers());
      game.game_socket.emit("new_turn", next_player.clonePlayer());
    });
  });

  function handleAction(game, player, action, data, callback) {
    var error = player.checkMoneyForAction(action, data.option);
    if (error) {
      return callback({status: "error", message: error});
    }
    if (typeof data.option == "undefined") {
      game.resetOptions();
      var options = player.getOptionsForAction(action);
      if (typeof options == "string") {
        return callback({status: "error", message: options});
      }

      options.forEach(function (o, i) {
        game.map[o.x][o.y].option = i + 1;
      });
      if (options.length == 1) {
        data.option = "1";
      } else {
        game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
        return callback({status: "options", options: options});
      }
    }

    var options = game.getOptions(data.option);
    player.performAction(action, options);
    game.resetOptions();
    game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
    game.game_socket.emit("update_players", game.clonePlayers());
    callback({status: "succes", player: player.clonePlayer()});
  }

}