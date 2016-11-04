$(document).ready(function () {


  window.socket = io.connect('/server', {query: 'game_id=' + window.game_id});
  window.socket.on('connect', function () {
    console.log("starting game " + window.game_id);
  });
  window.socket.on("_error", function (data) {
    console.log("[ERROR " + data.type + "] " + data.message);
    setTimeout(function () {
      location.reload();
    }, 1000);
  });

  /*
   * Serious business starts here
   */
  window.socket.on("update_players", function (players) {
    window.players = players;
    updatePlayersList();
  });
  window.socket.on("update_game", function (data) {
    window.map = data.map;
    window.trade = data.trade;
    window.variations = data.variations;
    updateMap();
    updateTrade();
  });
  window.socket.on("new_turn", function (player) {
    if ($("body").is(".waiting")) {
      $("body").removeClass("waiting").addClass("playing");
    }
    $(".current_player").html("Current player : " + playerToString(player));
  });
});

function updatePlayersList() {
  $(".players").html("<p>Players :</p>");
  if (Object.keys(players).length > 0) {
    $("body").removeClass("no-player");
    for (var player_id in players) {
      $(".players").append(playerToString(players[player_id]));
    }
  } else {
    $("body").addClass("no-player");
  }

  $(".recap").html("");
  for (var player_id in players) {
    $(".recap").append(playerToRecap(players[player_id]));
  }
}

function playerToString(p) {
  return "<div class=\"player player-" + p.id + (p.ready ? " ready" : "") + " " + p.color + "\">Player " + ((p.name !== "") ? p.name : p.id) + "</div>";
}
function playerToRecap(p) {
  var objects = "";
  for (var c in p.objects) {
    objects += '<span class="trade ' + c + '">' + p.objects[c] + ' &nbsp;</span>';
  }
  var diff = "";
  if (p.workers_differencial < 0) diff = "(" + Math.abs(p.workers_differencial) + " more needed)";
  else if (p.workers_differencial > 0) diff = "(" + Math.abs(p.workers_differencial) + " unoccupied)";
  return '<div class="player-recap player-' + p.id + '">' +
    '<div class="name ' + p.color + '">' + p.name + ' (' + p.money + '$)</div>' +
      //'Tiles : ' + p.tiles + '<br/>' +
    p.workers + ' workers ' + diff + ' paid ' + p.salary + '$ each<br/>' +
    'Production rate : ' + p.production_rate_max * 100 + '%' + ((p.production_rate_max != p.production_rate) ? " (" + p.production_rate * 100 + "%)" : "") + '<br/>' +
    objects + '<br/>' +
    '</div>';
}

function updateTrade() {
  $(".trades").html("");
  for (var key in window.trade) {
    $(".trades").append('<div class="trade ' + key + '">' + window.trade[key] + ' $ (' + window.variations[key] + ')</div>');
  }
}

function updateMap() {
  $(".board").html("");
  window.map.forEach(function (line, i) {
    line.forEach(function (tile, j) {
      var option = (typeof tile.option != "undefined" && tile.option != null) ? " option\" data-option=\"" + tile.option : "";
      var objects = "";
      if (typeof tile.data.objects != "undefined") {
        for (var c in tile.data.objects) {
          if (tile.data.objects[c] > 0)
            objects = '<div class="trade ' + c + '">' + tile.data.objects[c] + '</div>' + objects;
        }
      }
      $(".board").append(
        '<div class="tile x' + i + ' y' + j + ' ' + tile.type + ' owner-' + tile.owner + '">' +
        '<div class="inner' + option + '"></div>' +
        '<div class="objects">' + objects + '</div>' +
        '</div>');
    })
  });
}