import Ember from 'ember';

export default Ember.Route.extend({
  actions: {
     newPart(name){
       const car = this.modelFor('car');
       const part = this.store.createRecord('part', { name, car });
       part.save().then(() => {
         this.transitionTo('car.parts', car);
       });
     }
   }
});
