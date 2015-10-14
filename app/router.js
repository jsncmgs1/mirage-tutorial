import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('cars', {}, function(){
    this.route('new', {});
  });

  this.route('car', { path: '/car/:id' }, function(){
    this.route('parts', {});
    this.route('new-part', {});
  });
});

export default Router;
