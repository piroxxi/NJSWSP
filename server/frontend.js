module.exports = function(app, game){
  var mustache = require('mustache');
  var fs = require('fs');

  var cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // html rendering engine (see https://github.com/juliomatcom/express-mustache-template/blob/master/index.js)
  app.engine('html', function (filePath, options, callback) {
    fs.readFile(filePath, function (err, content) {
      if (err) return callback(new Error(err))

      var rendered = mustache.render(content.toString(), options)
      return callback(null, rendered)
    })
  });
  app.set('view engine', 'mustache');

  app.get('/', function (req, res) {
    var g;
    if( typeof req.cookies.njswsp_current_game == undefined ){
      g = game.newGame();
    } else {
      g = game.getGame(req.cookies.njswsp_current_game);
      if( g == null ){
        g = game.newGame();
      }
    }
    res.cookie('njswsp_current_game', g.id, { maxAge: 900000, httpOnly: true });
    res.render('index_server.html', {
      game_id: g.id
    });
  });

  app.get('/game/:game_id', function (req, res) {
    var g = game.getGame(req.params.game_id);
    if( g ){
      if( !g.isFull() ) {
        var p = g.newPlayer();
        res.render('index_client.html', {
          game_id: g.id,
          player_id: p.id,
          player_color: p.color,
          body_classes: "connected",
          error_message: ""
        });
      } else {
        res.render('index_client.html', {
          game_id: "",
          player_id: "",
          player_color: "",
          body_classes: "disconnected",
          error_message: "Game "+req.params.game_id+" is full!"
        });
      }
    } else {
      res.render('index_client.html', {
        game_id: "",
        player_id: "",
        player_color: "",
        body_classes: "disconnected",
        error_message: "Unnable to reach game "+req.params.game_id+"!"
      });
    }
  });
}