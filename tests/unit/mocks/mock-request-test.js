import {moduleFor, test} from 'ember-qunit';
import Ember from 'ember';
import FactoryGuy, {
  make, build, mockFindAll, mockQueryRecord, mockUpdate, mockSetup
} from 'ember-data-factory-guy';
import {inlineSetup} from '../../helpers/utility-methods';
import MockRequest from 'ember-data-factory-guy/mocks/mock-request';
import RequestManager from 'ember-data-factory-guy/mocks/request-manager';

const serializerType = '-json-api';

moduleFor('serializer:application', 'mockSetup', inlineSetup(serializerType));

test("accepts parameters", function(assert) {
  FactoryGuy.logLevel = 0;
  RequestManager.settings({responseTime: 0});

  mockSetup({ logLevel: 1 });
  assert.equal(FactoryGuy.logLevel, 1);

  mockSetup({ responseTime: 10 });
  assert.equal(RequestManager.settings().responseTime, 10);
});


moduleFor('serializer:application', 'MockRequest #fails', inlineSetup(serializerType));

test("status must be 3XX, 4XX or 5XX", function(assert) {
  const mock = new MockRequest('user');

  assert.throws(() => {
    mock.fails({ status: 201 });
  });
  assert.throws(() => {
    mock.fails({ status: 292 });
  });
  assert.throws(() => {
    mock.fails({ status: 104 });
  });

  assert.ok(mock.fails({ status: 300 }) instanceof MockRequest);
  assert.ok(mock.fails({ status: 303 }) instanceof MockRequest);
  assert.ok(mock.fails({ status: 401 }) instanceof MockRequest);
  assert.ok(mock.fails({ status: 521 }) instanceof MockRequest);
});

test("with convertErrors not set, the errors are converted to JSONAPI formatted errors", function(assert) {
  const mock = new MockRequest('user');
  let errors = { errors: { phrase: 'poorly worded' } };
  mock.fails({ response: errors });
  assert.deepEqual(mock.errorResponse, {
    errors: [
      {
        detail: 'poorly worded',
        source: { pointer: "data/attributes/phrase" },
        title: 'invalid phrase'
      }
    ]
  });
});

test("with convertErrors set to false, does not convert errors", function(assert) {
  const mock = new MockRequest('user');
  let errors = { errors: { phrase: 'poorly worded' } };
  mock.fails({ response: errors, convertErrors: false });
  assert.deepEqual(mock.errorResponse, errors);
});

test("with errors response that will be converted but does not have errors as object key", function(assert) {
  const mock = new MockRequest('user');
  let errors = { phrase: 'poorly worded' };
  assert.throws(() => {
    mock.fails({ response: errors, convertErrors: true });
  });
});

moduleFor('serializer:application', 'MockRequest#timeCalled', inlineSetup(serializerType));

test("can verify how many times a queryRecord call was mocked", async function(assert) {
  return Ember.run(async () => {
    const mock = mockQueryRecord('company', {}).returns({ json: build('company') });

    await FactoryGuy.store.queryRecord('company', {});
    await FactoryGuy.store.queryRecord('company', {});
    assert.equal(mock.timesCalled, 2);
  });
});

test("can verify how many times a findAll call was mocked", async function(assert) {
  return Ember.run(async () => {
    const mock = mockFindAll('company');

    await FactoryGuy.store.findAll('company');
    await FactoryGuy.store.findAll('company');
    assert.equal(mock.timesCalled, 2);
  });
});

test("can verify how many times an update call was mocked", async function(assert) {
  const company = make('company');
  const mock = mockUpdate(company);

  Ember.run(() => company.set('name', 'ONE'));
  await Ember.run(async () => company.save());

  Ember.run(() => company.set('name', 'TWO'));
  await Ember.run(async () => company.save());

  assert.equal(mock.timesCalled, 2);
});

//moduleFor('serializer:application', 'MockRequest#basicRequestMatches', inlineSetup(serializerType));
//
//test("fails if the types don't match", function(assert) {
//  const mock = new MockRequest('user');
//  sinon.stub(mock, 'getType').returns('POST');
//  sinon.stub(mock, 'getUrl').returns('/api/ember-data-factory-guy');
//
//  const settings = {
//    type: 'GET',
//    url: '/api/ember-data-factory-guy'
//  };
//
//  assert.ok(!mock.basicRequestMatches(settings));
//});
//
//test("fails if the URLs don't match", function(assert) {
//  const mock = new MockRequest('user');
//  sinon.stub(mock, 'getType').returns('GET');
//  sinon.stub(mock, 'getUrl').returns('/api/ember-data-factory-guy');
//
//  const settings = {
//    type: 'GET',
//    url: '/api/ember-data-factory-guy/123'
//  };
//
//  assert.ok(!mock.basicRequestMatches(settings));
//});
//
//test("succeeds if the URLs and the types match", function(assert) {
//  const mock = new MockRequest('user');
//  sinon.stub(mock, 'getType').returns('GET');
//  sinon.stub(mock, 'getUrl').returns('/api/ember-data-factory-guy');
//
//  const settings = {
//    type: 'GET',
//    url: '/api/ember-data-factory-guy'
//  };
//
//  assert.ok(mock.basicRequestMatches(settings));
//});
//
//test("succeeds even if the given URL has query parameters that don't match", function(assert) {
//  const mock = new MockRequest('user');
//  sinon.stub(mock, 'getType').returns('GET');
//  sinon.stub(mock, 'getUrl').returns('/api/ember-data-factory-guy');
//
//  const settings = {
//    type: 'GET',
//    url: '/api/ember-data-factory-guy?page=2'
//  };
//
//  assert.ok(mock.basicRequestMatches(settings));
//});


moduleFor('serializer:application', 'MockRequest #disable, #enable, and #destroy', inlineSetup(serializerType));

test("can enable, disable, and destroy mock", async function(assert) {
  return Ember.run(async () => {
    let json1 = build('user');
    let json2 = build('user');
    let mock1 = mockQueryRecord('user', { id: 1 }).returns({ json: json1 });
    mockQueryRecord('user', {}).returns({ json: json2 });

    assert.notOk(mock1.isDestroyed, "isDestroyed is false initially");

    let data = await FactoryGuy.store.queryRecord('user', { id: 1 });
    assert.equal(data.get('id'), json1.get('id'), "the first mock works initially");

    mock1.disable();
    data = await FactoryGuy.store.queryRecord('user', { id: 1 });
    assert.equal(data.get('id'), json2.get('id'), "the first mock doesn't work once it's disabled");

    mock1.enable();
    data = await FactoryGuy.store.queryRecord('user', { id: 1 });
    assert.equal(data.get('id'), json1.get('id'), "the first mock works again after enabling");

    mock1.destroy();
    assert.ok(mock1.isDestroyed, "isDestroyed is set to true once the mock is destroyed");
    data = await FactoryGuy.store.queryRecord('user', { id: 1 });
    assert.equal(data.get('id'), json2.get('id'), "the destroyed first mock doesn't work");
  });
});