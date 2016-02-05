var _ = require('lodash');

function TypeRegistry() {
  this._definitions = Object.create(null);
  this._referenced = Object.create(null);

  this.register('x-any', {properties: {}});
  this.register('ObjectID', {type: 'string', pattern: '^[a-fA-F\\d]{24}$'});
  this.register('GeoPoint', {
    properties: {
      lat: {type: 'number'},
      lng: {type: 'number'},
    },
  });
}

TypeRegistry.prototype.register = function (typeName, definition) {
  this._definitions[typeName] = definition;
};

TypeRegistry.prototype.reference = function (typeName) {
  this._referenced[typeName] = true;
  return typeName;
};

TypeRegistry.prototype.getDefinitions = function () {
  var defs = Object.create(null);
  for (var name in this._referenced) {
    if (this._definitions[name]) {
      defs[name] = _.cloneDeep(this._definitions[name]);
    } else {
      console.warn('Skipping unknown type %j.', name);
    }
  }
  return defs;
};

TypeRegistry.prototype.getAllDefinitions = function () {
  return _.cloneDeep(this._definitions);
};

TypeRegistry.prototype.getDefinitionByTypeName = function (typeName) {
  if (this.isDefined(typeName)) {
    return _.cloneDeep(this._definitions[typeName]);
  } else {
    return null;
  }
}

TypeRegistry.prototype.isDefined = function (typeName) {
  return typeName in this._definitions;
};

module.exports = TypeRegistry;
