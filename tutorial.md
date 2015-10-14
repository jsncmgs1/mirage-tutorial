## Stubbing a JSON API spec API with ember-cli-mirage

When developing a client side javascript app, you won’t always have an API available before you start. Even when you do, you probably don’t want to have your tests reliant on the the API end-points.

Luckily, there is a great solution to stubbing out an API while building your Ember app; [EmberCLI Mirage](http://www.ember-cli-mirage.com/). Mirage works great when Ember Data is expecting a REST API, but there's some manual conversion that must be done if you want to consume JSON API [^1](http://jsonapi.org/), which I ran into recently on a project.

In this tutorial we will leverage QUnit and Mirage's factories and API DSL to craft explicit acceptance tests as we build our application.

I’m going to assume you have some basic knowledge of Ember for this.

<hr/>

### Setup
```bash
$ ember new mirage-tutorial
$ cd mirage-tutorial
```

Vim users who use [Vim Projectionist](https://github.com/tpope/vim-projectionist) can curl a set of projections from my Github repo.

```bash
$ curl -G https://raw.githubusercontent.com/jsncmgs1/ember-vim-projections/
master/.projections.json -o .projections.json
```

We will use Ember/Ember Data 2.1.0 for this app, so let's update.

In your bower.json file:

change:
"ember": "{your version}" to "ember": "2.1.0"

and

"ember-data": "{your version}" to "ember-data": "2.1.0"

Then `nombom` with:

```bash
$ npm cache clear && bower cache clean && rm -rf node_modules bower_components && npm install && bower install
```

Ember and Ember Data should be updated.  To check, start your ember server and go to localhost:/4200 and you’ll see the “Welcome to Ember” page. Pull up the Ember
inspector, and click the left sub-nav “Info” button. Ember and Ember-data should both be at 2.1.0.

We will use the JSONAPI adapter, generate your adapter:

```bash
$ ember g adapter application
```
In the adapter file, change RESTAdapter to JSONAPIAdapter.

Now install mirage, then restart your server.

```bash
$ ember install ember-cli-mirage
```

Mirage will create a mirage directory under app/. It contains a `config.js` file, a factories directory, and a scenarios directory.

**Config file**: Mirage wraps Pretender, which intercepts requests that would normally hit your API, and allows you to specify the response that should be sent back.  This file is where you specify your API end-points.

Mirage gives you shorthand syntax for simple routes, but you can create manual routes when shorthand won’t work. [Mirage docs](http://www.ember-cli-mirage.com/docs/v0.1.x/defining-routes/) have a
short and clear description of how to handle your routes.

**Scenarios**: Mirage creates a default.js scenario for you.  Inside the scenario you declare all the data you want to seed your development environment with.  This data will not be in the test environment.

**Factories**: Your mirage scenario will use the factories you define to generate your data, and you should use them in your tests as well.

We will create a simple app that will list our cars and let us create new ones.  Our cars also contain parts, which can also be created. While the API team builds their their end, we’ll get started on our end.

<hr/>
### Listing our cars
Let's create a cars acceptance test.

```bash
$ ember g acceptance-test cars
```

Ember generates a test for us at tests/acceptance/cars-test.js, with a generated test which checks to make sure our route functions. Let's change it to test a link to the cars index on the application template.  When writing QUnit, you'll simulate all your user navigations ('click', 'visit', etc), which run asynchronously. Assertions are called in the andThen() callback, which will run after all the async operations are complete.
[^2](http://coryforsyth.com/2014/07/10/demystifing-ember-async-testing/)

```javascript
//app/tests/acceptance/cars.js
test('visiting /cars', function(assert) {
  visit('/');

  click('#all-cars');

  andThen(() => {
    assert.equal(currentURL(), '/cars');
  });
});
```

Our tests run at localhost:4200/tests. When you go to that page, in the Module drop down in the upper right and corner, choose 'Acceptance | cars'. We will get an error because we don’t have the `#all-cars` link.

Lets make our test pass. First, we need to create the link.

```html
<!-- app/templates/application.hbs -->
<h2 id="title">Welcome to Ember</h2>
{{link-to 'Cars' 'cars.index'}}

{{outlet}}
```

Now QUnit tells us there's no `cars.index` route.

```bash
$ ember g route cars
```

Ember will add the route for you in the router.js file.  It adds the empty object, but we also need to pass an empty function so that an `cars/index` route is generated. Unfortunately, `this.route('cars', {})` would not create it.

```javascript
//router.js
Router.map(function() {
  this.route('cars', {}, function(){});
});
```

Now check your test page, it passes.

Lets test that when we go to the cars page, we will actually see some cars. At the bottom of your cars acceptance test:

```javascript
//tests/acceptance/cars.js

test('I see all cars on the index page', (assert) => {
  server.create('car');
  visit('/cars');

  andThen(() => {
    const cars = find('li.car');
    assert.equal(cars.length, 1);
  });
});

```

`server.create('car')` is telling Mirage to find a factory named 'car', create 1 of those cars, and put them in the Mirage database. When you run the test, it will die due to a Mirage error.  I recommend running
your tests with the Chrome debugger open so you can see the errors.

Mirage will log an error saying it tried to find a ‘car’ factory, and it was not defined.  Lets make one at `app/mirage/factories/car.js`.

```javascript
// /app/mirage/factories/car.js
import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name(i) { return `Car ${i + 1}`;}
});
```
This will create a car with a name attribute. This `(i)` syntax is used for Mirage sequences, since we created a list of cars, the first name will be "Car 1", then "Car 2", etc.

If we check our tests again, it will fail, finding 0 cars when expecting 1. To get the cars on the page, our `car/index` route will need to load the car model.

Let’s create our car model. The Ember CLI generators are fantastic, but they will generate some tests that are not in the scope of this tutorial (unit tests).  You can remove them, or ignore them for now.  However, I wouldn't recommend leaving unused tests around.

```bash
$ ember g model car
```

```javascript
// /app/models/car.js
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string')
});
```

And our route/template:
```bash
$ ember g route cars/index
```

```javascript
// /app/routes/cars/index.js
import Ember from 'ember';

export default Ember.Route.extend({
  model(){
    return this.store.findAll('car');
  }
});
```

```html
<!--app/templates/cars/index.hbs-->

<ul class='cars'>
  {{#each model as |car|}}
    <li class='car'>
      {{car.name}}
    </li>
  {{/each}}
</ul>

```

When we hit the model hook in our route, Ember Data sends out a GET request to /cars. If you let the test run, the test will seem frozen without the chrome debugger open.  Mirage will log an error to the console saying there's no end point for `GET /cars`.

Let’s create a route for Mirage so it can intercept this request.  For the tutorial we will use the longer syntax, because Mirage doesn’t handle JSON API in the shorthand syntax - yet.

JSON API expects a response with a top level key named 'data', which contains an array of the resources returned.  Each resource should have a specified type,
the id of the resource, and the resource attributes. When Mirage responds to a request, it will log the response object in the console for inspection. The object should look like this:

```javascript
  data: {
    [
      {
        attributes: {
          id: 1,
          name: 'Car 1'
        },
        id: 1,
        type: 'cars'
      },
      {
        attributes: {
          id: 2,
          name: 'Car 2'
        },
        id: 2,
        type: 'cars'
      },
      //....
    ]
  }

```

There are other keys as well, such as errors, and relationships. We will expand on relations further in the tutorial.

```javascript
// /app/mirage/config.js

export default function() {
  this.get('/cars', (db, request) => {
    let data = {};
    data = db.cars.map((attrs) => {
      let rec = {type: 'cars', id: attrs.id, attributes: attrs};
      return rec;
    });

    return { data };
  });
};
```

When we run our tests again, they pass.  If you’d like to see it work in development, generate some cars in `scenarios/default.js`, and go to `localhost:4200/cars`.

```javascript
// /app/mirage/scenarios/default.js
export default function(server) {

    // Seed your development database using your factories. This data will not be loaded in your tests.
    server.createList('car', 10);
}
```

Whats going on here?

When we visit the cars route, ember sends us to the cars/index route. The route fires the model hook, where ember data sends out a GET request for all of the cars.  The mirage route in mirage/config.js intercepts the request, gets the cars that we generated in the test, adds them to a JSON API formatted object, and sends it back as the response.  No api needed!

Now that we have a working acceptance test, lets create a car component for our cars to live in.

```bash
ember g component a-car
```

Ember created a component integration test, which we'll use. It's easy to setup Mirage for an integration tests.  Under tests/helpers/, create a file called mirage.integration.js

```javascript
//tests/helpers/mirage-integration.js
import mirageInitializer from '../../initializers/ember-cli-mirage';

export default function setupMirage(container) {
  mirageInitializer.initialize(container);
}
```

and in your component test, import the setupMirage function, you will invoke in the moduleForComponent setup hook, passing in this.container.

```javascript
//app/tests/integration/components/a-car-test.js

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
```

In this test, we create a car, and a component (`this`) and set it on the component. Then we can actually render the template, and assert what the components text should be. Of course we haven't done anything with our component
yet, so the test fails.

In our `cars/index` template, we're rendering our component inside of an li, with a class of 'car'.  Add those attributes to the component.

```javascript
import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['car']
});
```

Move the `{{car.name}}` expression into the component template, and render the component in the each loop, passing the model into the component.
```html

<!-- templates/components/a-car.hbs -->
{{car.name}}
```

```html
<!-- templates/cars/index.hbs -->
Cars/Index

<ul class='cars'>
  {{#each model as |car|}}
    {{a-car car=car}}
  {{/each}}
</ul>
```

Run the tests, they should pass.

<hr/>
### Adding New Cars
Now that our cars index is tested and working, we need to be able to add more cars to our collection. Let's make a test.

```javascript
//tests/acceptance/cars-test.js
test('I can add a new car', function(assert){
  server.createList('car', 10); visit('/cars');

  click('#add-car'); fillIn('input[name="car-name"]', 'My new car');
  click('button');

  andThen(() => {
    const newCar = find('li.car:contains("My new car")');
    assert.equal(newCar.text().trim(), "My new car");
  });
});
```

Our test fails because there's no link with an id of add-car. This link should take us to the cars.new route. In your cars/index template at the bottom of the file, add:

```html
<!-- app/templates/cars/index.hbs -->
<!-- ... -->

{{#link-to 'cars.new' id='add-car'}}
  Add new car
{{/link-to}}
```

Now our test fails because we don't have the specified input field. We'll need the cars/new template, we also know that we will need that route. Generating the route will create both for us, as well as adding the route to our router.

```bash
ember g route cars/new
```

The router should now look like:

```javascript
//router.js
import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});


Router.map(function() {
  this.route('cars', function() {
    this.route('new', {});
  });
});

export default Router;
```

Add the form for creating a car to our cars/new template:

```html
<!--app/templates/cars/new.hbs-->
New Car

<form {{action 'createCar' name on='submit'}}>
  {{input name='car-name' value=name}}
  <button> Create Car </button>
</form>
```

We know we'll need an action to handle the creation of the car, so we'll go ahead and declare that now.  Our test will fail because there's nothing to handle the action named createCar yet. My preference is to handle anything related to data in the route when I can, so we'll do that.

```javascript
// /app/routes/cars/new.hbs
import Ember from 'ember';
export default Ember.Route.extend({
  actions: {
     createCar(name){
      const car = this.store.createRecord('car', { name });

      car.save()
        .then(() => {
          this.transitionTo('cars');
        }).catch(() => {
          // something that handles failures
        });
     }
   }

});
```

Now our Ember pieces are hooked up, but the test fails because mirage doesn't see a route that specifies a `POST` request to `/cars`. Add it to the Mirage config file.

```javascript
// /app/mirage/config.js

export default function() {
  //...

  this.post('/cars', (db, request) => {
    return JSON.parse(request.requestBody);
  });
};
```

Our JSONAPIAdapter sends the serialized data in the correct format, so all we have to do is parse it, and return it.

And with that our test should pass.

<hr/>
### Viewing Parts

I mentioned earlier that our cars contain parts. We'll make it so that when we click our car, we will be taken to that that car's parts page. Let's generate a test for parts.

```bash
$ ember g acceptance-test parts
```

Delete the generated test and add the following.

```javascript
//tests/acceptance/parts.js

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
```

Our first breakage occurs because Mirage has no part factory.

```javascript
//mirage/factories/part.js

import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name(i) { return `Part ${i}`; }
});
```

Now QUnit yells because we have no links. Turn our list of cars into links, so that when we click on one, we can see that car's parts.

```html
<!-- templates/components/a-car.hbs -->
{{#link-to 'car.parts' car class='car-link'}}
  {{car.name}}
{{/link-to}}
```

QUnit shames us for not having a car.parts route.

```bash
$ ember g route car/parts
```

The router should look like:
```javascript
//router.js
import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('cars', function() {
    this.route('new', {});
  });

  this.route('car', function(){
    this.route('parts', {});
  });
});

export default Router;
```

We'll add a dynamic segment of id to the car path.

```javascript
//...
  this.route('car', { path: '/car/:id'}, function(){
    this.route('parts');
  });
//...
});

export default Router;
```

Since our route is nested, we need to specify the model for the parent route.

```bash
$ ember g route car

```

In the car route, return the car specified by the id dynamic segment.

```javascript
//routes/car.js
import Ember from 'ember';

export default Ember.Route.extend({
  model(params){
    return this.store.find('car', params.id);
  }
});
```

We also have to create a Mirage route to GET a single car. At this point in the app, we have had our cars loaded from visiting the index, but a user could go straight to a `car/:id` url, so we need to handle that.
JSON API requires relationship information to be stored in a 'relationships' object. Add it to your mirage config file.

```javascript
//mirage/config.js
export default function() {
  //...

  this.get('/cars/:id', (db, request) => {
    let car = db.cars.find(request.params.id);
    let parts = db.parts.where({car_id: car.id});

    let data = {
      type: 'car',
      id: request.params.id,
      attributes: car,
      relationships: {
        parts:{
          data:{}
        }
      }
    }

    data['relationships']['parts']['data'] = parts.map((attrs) => {
      return { type: 'parts', id: attrs.id, attributes: attrs };
    });

    return { data };
  });

}

```

Additionally, in our Mirage '/cars' route, we are only
returning the car information, not the associated parts.  What this means is, if the first page we visit is the '/cars' page, those cars will already be loaded in the store (with no knowledge of any associated parts).
When we go to the cars/part page, the store won't fetch the model, because it's already loaded, and no parts will be loaded.  We should load those in the index.

```javascript
//mirage/config.js
export default function() {
  this.get('/cars', (db, request) => {
    let data = {};
    data = db.cars.map((attrs) => {

      let car = {
        type: 'cars',
        id: attrs.id,
        attributes: attrs ,
        relationships: {
          parts: {
            data: {}
          }
        },
      };

      car['relationships']['parts']['data'] = db.parts
      .where({car_id: attrs.id})
      .map((attrs) => {
        return {
          type: 'parts',
          id: attrs.id,
          attributes: attrs
        };
      });

      return car;

    });
    return { data };
  });
//....
```

We also need the Mirage end-points for getting a part.
```javascript
//mirage/config.js
export default function() {
//...
  this.get('parts/:id', (db, request) => {
    let part = db.parts.find(request.params.id);

    let data = {
      type: 'parts',
      id: request.params.id,
      attributes: part,
    };

    return { data };
  });
//...
```

Now we need a part model, and a factory.

```javascript
//models/part.js
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  car: DS.belongsTo('car')
});
```

```javascript
import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name(i) { return `Part ${i}`; }
});
```

And update our car model to show the association.

```javascript
//models/car.js
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  parts: DS.hasMany('part')
});
```

And our template:
```html

<!-- car/parts.hbs -->
Parts
<ul>
  {{model.name}}
  {{#each model.parts as |part|}}
    <li class='part'>
      {{part.name}}
    </li>
  {{/each}}
</ul>
```
And now our test should be green.

I'll leave converting the part into a component with an integration test as an exercise for you to complete. The steps are the same as they were for cars.

<hr/>
### Adding Parts
Our last test will cover adding parts. At the bottom of your parts acceptance test:

```javascript
//tests/acceptance/parts.js

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
```

Our test tells us we don't have a '.new-part' link. in our template:
```html

Parts
<!-- car/parts.hbs -->
<ul>
  {{model.name}}
  {{#each model.parts as |part|}}
    <li class='part'>
      {{part.name}}
    </li>
  {{/each}}
</ul>

{{#link-to 'car.new-part' model class='new-part'}}
  Add new Part
{{/link-to}}
```

```bash
$ ember g route car/new-part
```
Now we need a 'car.new-part' route.
```javascript
//router.js
Router.map(function() {
  this.route('cars', function() {
    this.route('new', {});
  });

  this.route('car', { path: '/car/:id' }, function(){
    this.route('parts', {});
    this.route('new-part', {});
  });
});
```

And a template for our route to render.
```html
<!--templates/car/new-part-->
New Part

<form {{action 'newPart' name on='submit'}}>
  {{input name='part-name' value=name}}
  <button> Create Part </button>
</form>
```

```javascript
//routes/car/new-part.js
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
```
And a Mirage endpoint:

```javascript
this.post('parts', (db, request) => {
  return JSON.parse(request.requestBody);
});
```

And we're done! This process will be even easier once Mirage supports JSON API, which is on its way.  You can view the source at https://github.com/jsncmgs1/mirage-tutorial.git.
<hr/>
1. [http://coryforsyth.com/2014/07/10/demystifing-ember-async-testing/)]
2. [http://jsonapi.org/]
