import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import FactoryGuy, { build, buildList, mockCreate } from 'ember-data-factory-guy';

import SharedCommonBehavior from './shared-common-behaviour';
import SharedAdapterBehaviour from './shared-adapter-behaviour';
import { inlineSetup } from '../helpers/utility-methods';

let serializer = 'DS.ActiveModelSerializer';
let serializerType = '-active-model';

SharedCommonBehavior.all(serializer, serializerType);

SharedAdapterBehaviour.mockFindRecordSideloadingTests(serializer, serializerType);
SharedAdapterBehaviour.mockFindAllSideloadingTests(serializer, serializerType);

SharedAdapterBehaviour.mockQueryMetaTests(serializer, serializerType);

SharedAdapterBehaviour.mockUpdateWithErrorMessages(serializer, serializerType);
SharedAdapterBehaviour.mockUpdateReturnsAssociations(serializer, serializerType);
SharedAdapterBehaviour.mockUpdateReturnsEmbeddedAssociations(serializer, serializerType);

SharedAdapterBehaviour.mockCreateReturnsAssociations(serializer, serializerType);
SharedAdapterBehaviour.mockCreateFailsWithErrorResponse(serializer, serializerType);
SharedAdapterBehaviour.mockCreateReturnsEmbeddedAssociations(serializer, serializerType);

moduleFor('serializer:application', `${serializer} #mockCreate custom`, inlineSetup(serializerType));

test("returns camelCase attributes", async function(assert) {
  let customDescription = "special description";

  mockCreate('profile').returns({attrs: {camel_case_description: customDescription}});

  let profile = Ember.run(() => FactoryGuy.store.createRecord('profile', {
    camel_case_description: 'description'
  }));

  await Ember.run(async () => profile.save());

  assert.ok(profile.get('camelCaseDescription') === customDescription);
});

moduleFor('serializer:application', `${serializer} FactoryGuy#build custom`, inlineSetup(serializerType));

test("embeds belongsTo record when serializer attrs => embedded: always ", function(assert) {

  let buildJson = build('comic-book', 'marvel');
  buildJson.unwrap();

  let expectedJson = {
    comic_book: {
      id: 1,
      name: 'Comic Times #1',
      company: {id: 1, type: 'Company', name: 'Marvel Comics'}
    }
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads belongsTo records which are built from fixture definition", function(assert) {

  let buildJson = build('profile', 'with_bat_man');
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      camel_case_description: 'textGoesHere',
      snake_case_description: 'text_goes_here',
      a_boolean_field: false,
      super_hero_id: 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});

test("sideloads belongsTo record passed as ( prebuilt ) attribute", function(assert) {

  let batMan = build('bat_man');
  let buildJson = build('profile', {superHero: batMan});
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      camel_case_description: 'textGoesHere',
      snake_case_description: 'text_goes_here',
      a_boolean_field: false,
      super_hero_id: 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});

test("sideloads hasMany records built from fixture definition", function(assert) {

  let buildJson = build('user', 'with_hats');
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        {type: 'big-hat', id: 1},
        {type: 'big-hat', id: 2}
      ],
    },
    'big-hats': [
      {id: 1, type: "BigHat"},
      {id: 2, type: "BigHat"}
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads hasMany records passed as prebuilt ( buildList ) attribute", function(assert) {

  let hats = buildList('big-hat', 2);
  let buildJson = build('user', {hats: hats});
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        {type: 'big-hat', id: 1},
        {type: 'big-hat', id: 2}
      ],
    },
    'big-hats': [
      {id: 1, type: "BigHat"},
      {id: 2, type: "BigHat"}
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads hasMany records passed as prebuilt ( array of build ) attribute", function(assert) {

  let hat1 = build('big-hat');
  let hat2 = build('big-hat');
  let buildJson = build('user', {hats: [hat1, hat2]});
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        {type: 'big-hat', id: 1},
        {type: 'big-hat', id: 2}
      ],
    },
    'big-hats': [
      {id: 1, type: "BigHat"},
      {id: 2, type: "BigHat"}
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("using custom serialize keys function for transforming attributes and relationship keys", function(assert) {
  let serializer = FactoryGuy.store.serializerFor('application');

  let savedKeyForAttributeFn = serializer.keyForAttribute;
  serializer.keyForAttribute = Ember.String.dasherize;
  let savedKeyForRelationshipFn = serializer.keyForRelationship;
  serializer.keyForRelationship = Ember.String.dasherize;

  let buildJson = build('profile', 'with_bat_man');
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      'camel-case-description': 'textGoesHere',
      'snake-case-description': 'text_goes_here',
      'a-boolean-field': false,
      'super-hero': 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);

  serializer.keyForAttribute = savedKeyForAttributeFn;
  serializer.keyForRelationship = savedKeyForRelationshipFn;
});

test("serializes attributes with custom type", function(assert) {
  let info = {first: 1};
  let buildJson = build('user', {info: info});
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      info: '{"first":1}'
    }
  };

  assert.deepEqual(buildJson, expectedJson);
});
