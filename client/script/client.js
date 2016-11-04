$(document).ready(function () {
  if ($("body").is(".disconnected")) return;

  window.socket = io.connect('/client', {query: 'game_id=' + window.game_id + "&player_id=" + window.player.id});
  window.socket.on('connect', function () {
    console.log("joining game " + window.game_id);
  });
  window.socket.on("_error", function (data) {
    console.log("[ERROR " + data.type + "] " + data.message);
    $("body").removeClass("connected").addClass("disconnected");
  });

  /*
   * Serious business starts here
   */
  // TODO(raphael) if cookie ....
  askNamePopup();
  $(".button.ready").click(function () {
    $(this).addClass("toggled")
    window.socket.emit("player_ready");
  });

  switch (window.player.color) {
    case "blue":
      $(".game>p").css("color", "#3c96b8");
      break;
    case "pink":
      $(".game>p").css("color", "#ae3cb8");
      break;
    case "yellow":
      $(".game>p").css("color", "#b8ab3c");
      break;
    case "green":
      $(".game>p").css("color", "#3cb878");
      break;
  }

  window.socket.on("game_started", function (data) {
    $("body").addClass("started");
    $("body").addClass("waiting");
  });
  window.socket.on("game_finished", function (data) {
    $("body").addClass("finished");
  });


  window.socket.on("turn_start", function (data) {
    $("body").removeClass("waiting");
    window.player = data.player;
    alert(data.message);
    updateInfos();
  });
  $(".button.buy-field").click(function () {
    handleActionWithOption("buy-field");
  });
  $(".button.build-factory").click(function () {
    handleActionWithOption("build-factory");
  });
  $(".upgrade-factory").click(function () {
    handleActionWithOption("upgrade-factory");
  });
  $(".build-houses").click(function () {
    handleActionWithOption("build-houses");
  });
  $(".build-store").click(function () {
    handleActionWithOption("build-store");
  });
  $(".build-laboratory").click(function () {
    handleActionWithOption("build-laboratory");
  });


  $(".button.change-factory-production").click(function () {
    $(".options").remove();
    $(".change-factory-production.button").after("<div class=\"options change-factory-production-options\"></div>");
    for (var color in {"red": "", "orange": "", "cyan": "", "green": ""}) {
      if (window.player.production_color != color)
        $(".change-factory-production-options").append("<a class=\"button option trade " + color + "\" option=\"" + color + "\">" + color + "</a>");
    }
    $(".change-factory-production-options>.option").click(function () {
      window.socket.emit("change-factory-production", {color: $(this).attr("option")}, function (data) {
        if (data.status == "error") {
          alert(data.message);
        } else {
          window.player = data.player;
          updateInfos();
        }
        $(".change-factory-production-options").remove();
      });
    });
    $(".change-factory-production-options").append("<a class=\"button cancel\" >X</a>");
    $(".change-factory-production-options>.cancel").click(function () {
      $(".change-factory-production-options").remove();
    });
  });

  $(".button.sell-production").click(function () {
    $(".options").remove();
    $(".sell-production.button").after("<div class=\"options sell-production-options\"></div>");
    for (var color in {"red": "", "orange": "", "cyan": "", "green": ""}) {
      if (window.player.objects[color] > 0)
        $(".sell-production-options").append("<a class=\"button option trade " + color + "\" option=\"" + color + "\">" + color + "</a>");
    }
    $(".sell-production-options>.option").click(function () {
      window.socket.emit("sell-production", {color: $(this).attr("option")}, function (data) {
        if (data.status == "error") {
          alert(data.message);
        } else {
          window.player = data.player;
          updateInfos();
        }
        $(".sell-production-options").remove();
      });
    });
    $(".sell-production-options").append("<a class=\"button cancel\" >X</a>");
    $(".sell-production-options>.cancel").click(function () {
      $(".sell-production-options").remove();
    });
  });

  $(".button.change-production-rate").click(function () {
    $(".options").remove();
    $(".change-production-rate.button").after(
      "<div class=\"options change-production-rate-options\">" +
      '  <input class="change-production-rate-input" type="range" name="production-rate" value="' + (window.player.production_rate_max * 100) + '" step="1" min="0" max="100">' +
      '  <span class="change-production-rate-value">' + (window.player.production_rate_max * 100) + '%</span>' +
      "  <a class=\"button accept\" >select</a>" +
      "  <a class=\"button cancel\" >X</a>" +
      "</div>"
    );
    $(".change-production-rate-input").on('input', function () {
      $(".change-production-rate-value").text($(this)[0].value + "%");
    });
    $(".change-production-rate-options>.accept").click(function () {
      window.socket.emit("change-production-rate", {rate: parseInt($(".change-production-rate-input")[0].value) / 100}, function (data) {
        if (data.status == "error") {
          alert(data.message);
        } else {
          window.player = data.player;
          updateInfos();
        }
        $(".change-production-rate-options").remove();
      });
    });
    $(".change-production-rate-options>.cancel").click(function () {
      $(".change-production-rate-options").remove();
    });
  });
  $(".button.change-salary").click(function () {
    $(".options").remove();
    $(".change-salary.button").after(
      "<div class=\"options change-salary-options\">" +
      "  <a class=\"button less\" >-</a>" +
      '  <span class="change-salary-value">' + window.player.salary + '</span>$/worker' +
      "  <a class=\"button more\" >+</a>" +
      "  <a class=\"button accept\" >select</a>" +
      "  <a class=\"button cancel\" >X</a>" +
      "</div>"
    );
    $(".change-salary-options>.less").click(function () {
      $(".change-salary-value").text(Math.max(0, parseInt($(".change-salary-value").text()) - 1));
    });
    $(".change-salary-options>.more").click(function () {
      $(".change-salary-value").text(parseInt($(".change-salary-value").text()) + 1);
    });
    $(".change-salary-options>.accept").click(function () {
      window.socket.emit("change-salary", {salary: parseInt($(".change-salary-value").text())}, function (data) {
        if (data.status == "error") {
          alert(data.message);
        } else {
          window.player = data.player;
          updateInfos();
        }
        $(".change-salary-options").remove();
      });
    });
    $(".change-salary-options>.cancel").click(function () {
      $(".change-salary-options").remove();
    });
  });

  $(".button.end-turn").click(function () {
    console.log("end of turn");
    window.socket.emit("turn_ended");
    $("body").addClass("waiting");
  })

  function askNamePopup() {
    function onSubmit() {
      $(".popup.name .warning").remove();
      var name = $(".popup.name input[type='text']")[0].value;
      if (name.length < 3) {
        $(".popup.name").append('<div class="message">3 characters at least</div>');
        return;
      }
      window.socket.emit("set_player_name", {player_id: window.player.id, player_name: name}, function (data) {
        if (data.status == "success") {
          window.player.name = name;
          $(".game>p").text("You are player " + name + ".");
          $(".popup.name").parent().remove();
        } else {
          $(".popup.name").append('<div class="message">' + data.message + '</div>');
        }
      });
    };
    $("body").prepend(
      '<div class="popup-wrapper">' +
      '<div class="popup name">' +
      '<h2>Select a name :</h2>' +
      '<input type="text" name="player_name" value="' + randomName() + '">' +
      '<input type="submit" value="Select">' +
      '</div>' +
      '</div>'
    );
    $(".popup.name input[type='text']").focus();
    $(".popup.name input[type='text']").on("keypress", function (e) {
      if (e.keyCode == 13) {
        onSubmit();
        e.preventDefault();
        return false;
      }
    });
    $(".popup.name input[type='submit']").click(function () {
      onSubmit();
    });
  }

  $("a").click(function () {
    button = $(this);
    button.addClass("clicked");
    setTimeout(function () {
      button.removeClass("clicked");
    }, 200);
  });

  function randomName() {
    var fake_names = {
      blue: ["Batman", "Morgan Freeman", "Captain America", "Thor"],
      pink: ["Superman", "Luke Skywalker", "The Doctor", "Mario"],
      yellow: ["Iron Man", "Dark Vador", "Homer Simpson", "The Dude"],
      green: ["Hulk", "Shrek", "Luigi", "Harry Potter"],
    };
    return fake_names[window.player.color][Math.floor(Math.random() * fake_names[window.player.color].length)];
  }

  function updateInfos() {
    if ($(".money").length == 0) {
      $(".game>p").after("<div class=\"production-color\"></div>");
      $(".game>p").after("<div class=\"money\"></div>");
    }
    $(".money").text("Current money : " + window.player.money + "$");
    $(".production-color").html("Your factories are producing : " +
      "<span class=\"trade " + window.player.production_color + "\">" + window.player.production_color + "</span> cubes.");
  }

  function handleActionWithOption(action) {
    window.socket.emit(action, {}, function (data) {
      console.log("callback for action " + action + " (" + JSON.stringify(data) + ");");
      $(".options").remove();
      if (data.status == "error") {
        alert(data.message);
      } else if (data.status == "options") {
        $("." + action + ".button").after("<div class=\"options " + action + "-options\"></div>");
        data.options.forEach(function (option, i) {
          $("." + action + "-options").append("<a class=\"button option\" option=" + (i + 1) + ">" + (i + 1) + "</a>");
        });
        $("." + action + "-options").append("<a class=\"button option\" option=\"all\">All</a>");
        $("." + action + "-options>.option").click(function () {
          window.socket.emit(action, {option: $(this).attr("option")}, function (data) {
            if (data.status == "error") {
              alert(data.message);
            } else {
              window.player = data.player;
              updateInfos();
            }
            $("." + action + "-options").remove();
          });
        });
        $("." + action + "-options").append("<a class=\"button cancel\" >X</a>");
        $("." + action + "-options>.cancel").click(function () {
          $("." + action + "-options").remove();
        });
      } else {
        window.player = data.player;
        updateInfos();
      }
    });
  }
});
