// everytrhing related to the server in one file

// everytrhing related to the express in another file
// requiring mongoose
// mongoose aloows node to use mongodb in more efficient way
const mongoose = require('mongoose');

const dotenv = require('dotenv');

// SYNCHRONOUS ERRORS

// UNCAUGHT EXCEPTION.

// IT SHOULD BE IN TOP BECOZ THEN ONLY IT CAN ISTEN TO AN EVENT
// SUPPOSE IF WE PUT CONSOLE.LOG(X) ABOVE THIS THEN WE WILL NOT HANDLE IT
// BECOZ IT EMITS AN EVENT AND APP WILL BE CRASHED BUT AFTER THAT ONLY WE ARE LISTENING TO THAT EVENT
// SO PUT THEM IN TOP

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION Shutting down 💥');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

dotenv.config({ path: './config.env' });

// connecting put the url here
const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    //Dont worry about below it is just like a recepe
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  //After connecting it will return a promise
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successful');
  });
// .catch((err) => {
//   console.log(err);
// })

// SCHEMA AND MODEL---------------------------------------------

// this logic is now in models folder

// Creating Schema so we create model out of it
// Schema - to describe data, to set default values,etc
// model - blueprint that we use to create documents

// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     // So this field is required if not given then it will show the error below mentioned
//     required: [true, 'A tour should have a name'],
//     // so no two tour can have same name
//     unique: true,
//   },
//   rating: {
//     type: Number,
//     default: 4.5,
//   },
//   price: {
//     type: Number,
//     required: [true, 'A tour must have a price'],
//   },
// });
// // Now we created a schema
// // Now we can create a model out of it
// // always use CAPITAL LETTER for MODEL
// const Tour = mongoose.model('Tour', tourSchema);

// We can create new documents in db
// mongoose will automatically create collection name from model name by making it plural
// creating instance of document
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });
// // To save it in db
// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log('Error: ', err));

// To check the environment
// console.log(app.get('env'));
// All env variables
// console.log(process.env.DATABASE);
// to define our own go to console and NODE_ENV=development nodemon server.js
// we cant define all in console so create a new file config.env

// 4.staring the server---------------
const port = 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Suppose if there might also occur error out of express

// Eg: if we give wrong db password we will get unhandled promise rejection

// This rejection is not handled anywhere

// one way we can use catch after then in line 27

// but we have to implement a global handler that will handle all unhandled promise rejection . It is good to have safety place like this because we dev will always make errors.

// we can use event and event emitter concept

// Whenever there is unhandled promise rejection the process object will emit an event called unhandled rejection. We can listen to that event like

process.on('unhandledRejection', (err) => {
  // console.log(err.name, err.message);
  // we have to shutdown our app in such cases
  console.log('Shutting down 💥');

  // process.exit();
  // this is abrupt way to end a program becoz this will immediately abort all req that are still running or pending
  // so first close server and then shut down the app
  server.close(() => {
    process.exit(1);
  });
});
// console.log(x);
// SYNCHRONOUS ERRORS

// UNCAUGHT EXCEPTION.

// IT SHOULD BE IN TOP BECOZ THEN ONLY IT CAN ISTEN TO AN EVENT
// SUPPOSE IF WE PUT CONSOLE.LOG(X) ABOVE THIS THEN WE WILL NOT HANDLE IT
// BECOZ IT EMITS AN EVENT AND APP WILL BE CRASHED BUT AFTER THAT ONLY WE ARE LISTENING TO THAT EVENT
// SO PUT THEM IN TOP
// process.on('uncaughtException', (err) => {
//   console.log(err.name, err.message);
// });

// Here we have not defined x anywhere
// It doesnt exist
// so to handle these errors we use unhandledException above
// console.log(x);
