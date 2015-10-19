export default function(server) {

  // Seed your development database using your factories. This
  // data will not be loaded in your tests.

  let car = server.create('car');
  server.createList('part', 4, { car_id: car.id });
}
