import Ember from 'ember';
export default Ember.Route.extend({
  actions: {
    createCar(name){
      const car = this.store.createRecord('car', { name });
        car.save()
        .then(() => {
          this.transitionTo('cars');
        }).catch(() => {
          //something that handles failures
      });
    }
  }

});
