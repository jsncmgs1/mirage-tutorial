import { moduleForComponent, test } from 'ember-qunit';
import startMirage from '../../helpers/mirage-integration';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('a-car', 'Integration | Component | a car', {
  integration: true,
  setup() {
    startMirage(this.container);
  }
});

test('it renders', function(assert) {
  const car = server.create('car');
  this.set('car', car);
  this.render(hbs`{{a-car car=car}}`);

  assert.equal(this.$().text().trim(), 'Car 1');
});
