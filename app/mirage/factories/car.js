import Mirage from 'ember-cli-mirage';
export default Mirage.Factory.extend({
  name(i) { return `Car ${i + 1}`;}
});
