import FactoryGuy from '../factory-guy';
import Ember from 'ember';

function _fetch(store, modelName, ids) {
  let models = ids.map(function (id) {
    return store.peekRecord(modelName, id);
  });
  return models;
}

function serializeModels(modelName, models) {
  Ember.assert('argument ( models ) must be an array - found type:' + Ember.typeOf(models), Ember.isArray(models));
  models = Ember.makeArray(models);

  var json = models.map(function (model) {
    return {id: model.id, type: model.constructor.modelName};
  });

  return FactoryGuy.getFixtureBuilder().convertForBuild(modelName, json);
}

export default function dispatchReturns(store, modelName, options = {}) {
  let responseJson;
  let responseOptions;

  const responseKeys = ['models', 'json', 'ids'].filter((k)=> options.hasOwnProperty(k));
  Ember.assert(`[ember-data-factory-guy] You can pass zero or one one output key to 'returns',
               you passed ${responseKeys.length}: ${responseKeys.toString()}`, responseKeys.length <= 1);

  const [ responseKey ] = responseKeys;

  switch(responseKey) {
    case 'ids':
      const models = _fetch(store, modelName, options.ids);
      responseJson = serializeModels(modelName, models);
      break;
    case 'models':
      responseJson = serializeModels(modelName, options.models);
      break;
    case 'json':
      responseJson = options.json;
      break;
  }

  // We do a shallow clone of options to avoid mutability side-effects
  // TODO do a deep clone instead of a shallow clone
  responseOptions = Ember.merge({}, options);
  delete responseOptions[responseKey];
  return [ responseJson, responseOptions ];
}
