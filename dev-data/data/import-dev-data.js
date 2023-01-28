const fs = require('fs');
const mongoose = require('mongoose');

const dotenv = require('dotenv');

// const { dirname } = require('path');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

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
  //After connecting it will return a promis
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successful');
  });

//   READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INNTO JSON
const importData = async () => {
  try {
    await Tour.create(tours); //create also accept array of objects and create a document for each object
    await User.create(users, { validateBeforeSave: false }); //create also accept array of objects and create a document for each object
    await Review.create(reviews); //create also accept array of objects and create a document for each object
    console.log('Data succesfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETING ALL DATA FROM COLLECTIONS BEFORE
const deleteData = async () => {
  try {
    await Tour.deleteMany(); //it will delete all collections
    await User.deleteMany(); //it will delete all collections
    await Review.deleteMany(); //it will delete all collections
    console.log('Data succesfully deleted');
    process.exit();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// now call node dev-data/data/import-dev-data.js --import to import data
// now call node dev-data/data/import-dev-data.js --delete to delete data
// console.log('this is', process.argv);
