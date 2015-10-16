export default function() {
  this.get('/cars', (db) => {
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

      car.relationships.parts.data = db.parts
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

  this.post('/cars', (db, request) => {
    return JSON.parse(request.requestBody);
  });

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
    };

    data.relationships.parts.data = parts.map((attrs) => {
      return { type: 'parts', id: attrs.id, attributes: attrs };
    });

    return { data };
  });

  this.get('parts/:id', (db, request) => {
    let part = db.parts.find(request.params.id);

    let data = {
      type: 'parts',
      id: request.params.id,
      attributes: part,
    };

    return { data };
  });

  this.post('parts', (db, request) => {
      return JSON.parse(request.requestBody);
  });
}
