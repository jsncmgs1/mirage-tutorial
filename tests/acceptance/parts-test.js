import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'mirage-tutorial/tests/helpers/start-app';

module('Acceptance | parts', {
  beforeEach: function() {
                this.application = startApp();
              },

  afterEach: function() {
               Ember.run(this.application, 'destroy');
             }
});

test('when I click a car, I see its parts', (assert) => {
  const car = server.create('car');
  const parts = server.createList('part', 4, { car_id: car.id });
  visit('/cars');
  click('.car-link');

  andThen(() => {
    assert.equal(currentURL(), `/car/${car.id}/parts`);
    assert.equal(find('.part').length, parts.length);
  });
});

test('I can add a new part to a car', (assert) => {
  server.create('car');
  visit('/cars');
  click('.car-link');
  click('.new-part');

  fillIn('input[name="part-name"]', "My new part");
  click('button');
  andThen(() => {
    assert.equal(find('.part').text().trim(), "My new part");
  });
});
