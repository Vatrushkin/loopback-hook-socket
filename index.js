var _ = require('underscore');
var cons = require('consolidate');
var path = require('path');
var SocketHook = require('./lib/socket-hook');

var _config = require('./lib/config/default');
var _hooks = {};
var STATIC_ROOT = path.join(__dirname, 'public');

module.exports = LoopbackHookSocket;

function LoopbackHookSocket(loopbackApplication, options) {
  options = _.defaults(options, _config);
  loopbackApplication.set('loopback-hook-socket', options);
  if (options.enabled) {
    start(loopbackApplication, options);
  }
}

function start(loopbackApplication, options) {
  if (options.eventView) {
    loopbackApplication.use(options.mountPath, function (req, res, next) {
      loopbackApplication.engine('html', cons.swig);
      loopbackApplication.set('view engine', 'html');
      loopbackApplication.set('views', STATIC_ROOT);
      loopbackApplication.use(loopbackApplication.loopback.static(STATIC_ROOT));
      var events = SocketHook.formatRoutes(loopbackApplication);
      res.render('index.html', {events: events});
    });
  }

  var server = require('http').Server(loopbackApplication);
  var io = require('socket.io').listen(server);

  io.on('connection', function (socket) {
    _hooks[socket.id] = new SocketHook(loopbackApplication, socket, options);
  });
  server.listen(options.port);
}
