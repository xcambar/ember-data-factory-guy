import Ember from 'ember';
import FactoryGuy from './factory-guy';
import dispatchReturns from 'ember-data-factory-guy/utils/dispatch-returns';
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

  this.returns = function (options = {}) {
    [ responseJson, responseOptions ] = dispatchReturns(FactoryGuy.get('store'), modelName, options);
    return this;
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
