var io;
module.exports = function (app, server, io, gameManager) {
  io.of('/server').on('connection', function (socket) {
    var q = socket.handshake.query;
    console.log("new server connection (game="+q.game_id+")");
    var game = gameManager.getGame(q.game_id);
    if (!game) {
      console.log(" >> game does not exists !");
      socket.emit("_error", {
        "type": "unexisting_game",
        "message": "Unnable to reach game " + q.game_id + "!"
      });
      return;
    }
    game.game_socket = socket;
    game.game_socket.emit("update_players", game.clonePlayers());
    if( game.started ){
      game.game_socket.emit("update_game", {map: game.map, trade: game.trade, variations: game.variations});
      game.game_socket.emit("new_turn", game.players[game.current_player].clonePlayer());
    }
  });
}