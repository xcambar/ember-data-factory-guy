import Ember from 'ember';
import FactoryGuy from './factory-guy';
import $ from 'jquery';

// compare to object for loose equality
function isEquivalent(a, b) {
  var aProps = Object.keys(a);
  var bProps = Object.keys(b);

  if (aProps.length !== bProps.length) {
    return false;
  }

  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];

    if (a[propName] !== b[propName]) {
      return false;
    }
  }
  return true;
}

function _fetch(modelName, ids) {
  var store = FactoryGuy.get('store');
  let models = ids.map(function (id) {
    return store.peekRecord(modelName, id);
  });
  return models;
}

var MockQueryRequest = function (url, modelName, queryParams) {
  var succeed = true;
  var status = 200;
  var responseJson = FactoryGuy.getFixtureBuilder().convertForBuild(modelName, []);
  var errors = {};
  var currentQueryParams = queryParams;
  let responseOptions = {};

  this.withParams = function (queryParams) {
    currentQueryParams = queryParams;
    return this;
  };

  this.returnsModels = function (models) {
    Ember.deprecate(
      '`returnsModel` has been deprecated. Use `returns({ model }) instead.`',
      true,
      { id: 'ember-data-factory-guy.returnsModel', until: '3.0.0' }
    );
    return this.returns({ models });
  };

  this.returnsJSON = function (json) {
    Ember.deprecate(
      '`returnsJSON` has been deprecated. Use `returns({ json }) instead.`',
      true,
      { id: 'ember-data-factory-guy.returnsJSON', until: '3.0.0' }
    );
    return this.returns({ json });
  };

  this.returnsExistingIds = function (ids) {
    Ember.deprecate(
      '`returnsExistingIds` has been deprecated. Use `returns({ ids }) instead.`',
      true,
      { id: 'ember-data-factory-guy.returnsExistingIds', until: '3.0.0' }
    );
    return this.returns({ ids });
  };

  // TODO .. test this is working
  this.andFail = function (options) {
    options = options || {};
    succeed = false;
    status = options.status || 500;
    if (options.response) {
      errors = FactoryGuy.getFixtureBuilder().convertResponseErrors(options.response);
    }
    return this;
  };

  this.returns = function (options = {}) {
    const responseKeys = ['models', 'json', 'ids'].filter((k)=> options.hasOwnProperty(k));
    Ember.assert(`[ember-data-factory-guy] You can pass zero or one one output key to 'returns',
                 you passed ${responseKeys.length}: ${responseKeys.toString()}`, responseKeys.length <= 1);

    const [ responseKey ] = responseKeys;

    switch(responseKey) {
      case 'ids':
        return this.returns({ models: _fetch(modelName, options.ids) });
      case 'models':
        let { models } = options;
        Ember.assert('argument ( models ) must be an array - found type:' + Ember.typeOf(models), Ember.isArray(models));
        models = Ember.makeArray(models);

        var json = models.map(function (model) {
          return {id: model.id, type: model.constructor.modelName};
        });

        responseJson = FactoryGuy.getFixtureBuilder().convertForBuild(modelName, json);
        break;
      case 'json':
        responseJson = options.json;
        break;
    }

    responseOptions = Ember.merge({}, options);
    delete responseOptions[responseKey];
    return this;
  };

  var handler = function (settings) {
    if (settings.url === url && settings.type === "GET") {
      if (succeed) {
        if (currentQueryParams) {
          if (!isEquivalent(currentQueryParams, settings.data)) {
            return false;
          }
        }
        return Ember.merge({status: 200, responseText: responseJson}, responseOptions);
      } else {
        return Ember.merge({status: status, responseText: errors}, responseOptions);
      }
    } else {
      return false;
    }
  };

  $.mockjax(handler);
};

export default MockQueryRequest;
