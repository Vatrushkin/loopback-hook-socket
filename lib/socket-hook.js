var request = require('request');

var routeParser = require('./route-parser');
var modelHelper = require('./model-helper');
var TypeRegistry = require('./type-registry');
var errorsList = require('./vo/errors-list');
var _ = require('underscore');

var _hookOptions;
var _self;


function SocketHook(loopbackApplication, socket, options) {
  _hookOptions = options;
  this.typeRegistry = createAndInitTypeRegistry(loopbackApplication);
  this.hookData = formatRoutes(loopbackApplication, this.typeRegistry);
  this.handleSocketEvents(socket);
  _self = this;
}

function createAndInitTypeRegistry(loopbackApplication) {
  var typeRegistry = new TypeRegistry();
  var loopbackRegistry = loopbackApplication.registry ||
    loopbackApplication.loopback.registry ||
    loopbackApplication.loopback;
  var models = loopbackRegistry.modelBuilder.models;

  for (var modelName in models) {
    modelHelper.registerModelDefinition(models[modelName], typeRegistry);
  }
  return typeRegistry;
}

function matchClassDef(route, classes) {
  // Get the class definition matching this route.
  var className = route.method.split('.')[0];
  var classDef = classes.filter(function (item) {
    return item.name === className;
  })[0];
  return classDef;
}

SocketHook.prototype.handleSocketEvents = function (socket) {
  this.hookData.forEach(function (hookItemData) {
    socket.on(hookItemData.event, function (data) {
      if (isDataAccepted(data, hookItemData)) {
        sendRequestToAPI(data, hookItemData)
          .then(function (data) {
            var apiResponse;
            if (data.error) {
              apiResponse = {
                error: {
                  statusCode: data.error.statusCode,
                  message: data.error.message
                }
              };
            } else {
              apiResponse = data;
            }
            socket.emit(hookItemData.event, apiResponse);
          })
          .catch(function (err) {
            socket.emit(_hookOptions.errorEvent, {
              error: err
            });
          });
      } else {
        socket.emit(_hookOptions.errorEvent, {
          error: errorsList.NOT_ENOUGH_PARAMETERS
        });
      }
    });
  })
}

function isDataAccepted(data, hookData) {
  var params = _.keys(data);
  var typeRegistry = this.typeRegistry;
  hookData.accepts.forEach(function (acceptedParam) {
    // check required parameters in route accepts
    if (_.indexOf(params, acceptedParam.name) < 0 && acceptedParam.required) {
      return false;
    }

    if (_.indexOf(params, acceptedParam.name) > 0 && acceptedParam.in === 'body' || acceptedParam.in === 'formData') {
      var definition = typeRegistry.getDefinitionByTypeName(acceptedParam.schema.$ref);
      // check required properties in model definition
      if (params[acceptedParam.name].length == 0 && definition.required.length > 0) {
        return false;
      }
      var modelParams = _.keys(params[acceptedParam.name]);
      definition.required.forEach(function (requiredParam) {
        if (_.indexOf(modelParams, requiredParam) < 0) {
          return false;
        }
      });
    }
  });
  return true;
}

function sendRequestToAPI(data, hookData) {
  return new Promise(function (resolve, reject) {
    var requestData = {};
    requestData.method = hookData.method;
    requestData.uri = _hookOptions.apiURI + hookData.path;

    for (var param in data) {
      var metadata;
      hookData.accepts.forEach(function (paramMetaData) {
        if (paramMetaData.name == param) {
          metadata = paramMetaData;
        }
      })
      addParam(metadata, data[param], requestData);
    }

    request(requestData, function (err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(response.body));
      }
    })
  });
}

function addParam(param, value, requestData) {
  var modelParam;
  switch (param.in) {
    case 'path':
      requestData.uri = requestData.uri.replace(':' + param.name, value);
      break;
    case 'query':
      requestData.uri += requestData.uri.indexOf('?') > 0 ?
      '&' + param.name + '=' + value :
      '?' + param.name + '=' + value;
      break;
    case 'body':
      var body = requestData.json || {};
      for (modelParam in value) {
        body[modelParam] = value[modelParam];
      }
      requestData.json = body;
      break;
    case 'formData':
      var formData = requestData.formData || {};
      for (modelParam in value) {
        formData[modelParam] = value[modelParam];
      }
      requestData.formData = formData;
      break;
  }
}

module.exports = SocketHook;

module.exports.formatRoutes = function formatRoutes(loopbackApplication, typeRegistry) {
  var result = new Array();

  var remotes = loopbackApplication.remotes();
  var adapter = remotes.handler('rest').adapter;
  var routes = adapter.allRoutes();
  var classes = remotes.classes();

  if (!typeRegistry) {
    typeRegistry = createAndInitTypeRegistry(loopbackApplication);
  }

  routes.forEach(function (route) {
    if (!route.documented) return;

    var classDef = matchClassDef(route, classes);

    if (!classDef) {
      console.error('Route exists with no class: %j', route);
      return;
    }

    var socketHookData = routeParser.convertRouteToSocketHookData(route, classDef, typeRegistry);
    result.push(socketHookData);
  });

  return result;
}
