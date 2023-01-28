const mongoose = require('mongoose');
const slugify = require('slugify');
// eslint-disable-next-line no-unused-vars
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // So this field is required if not given then it will show the error below mentioned
      required: [true, 'A tour should have a name'],
      // so no two tour can have same name
      unique: true,
      trim: true,
      // Validators: checking if enterd values are in right format for each field in our document schema
      // Eg: required is one built-in validator
      // OTHERS
      // maxlength is only for strings
      // it also work for update because we have given runValidator: true
      maxlength: [
        40,
        'The tour name must be lesser than or equal to 40 characters',
      ],
      minlength: [
        10,
        'The tour name must be greater than or equal to 10 characters',
      ],
      // plugging in libraries
      // validate: [validator.isAlpha, 'A name must only characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy,medium or difficult',
      },
    },
    // we want one field for ratings average and rating quantity
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // the average usually have like 4.667767 but we want it to round
      set: (val) => Math.round(val * 10) / 10, //it runs each time a new vakue set to this field. But round will round to integer so *10 and /10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom Validators
      // it is only valid for creating not for updating because this points only to newly creating doc
      validate: {
        validator: function (val) {
          //val --> currently enterd value(priceDiscount value)
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price', //{VALUE} -> CURRENTLY ENTERD VALUE HERE priceDiscount
      },
    },
    summary: {
      type: String,
      trim: true, //remove all white space
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //only the name of the image then we can read from the file system
      required: [true, 'A tour must have a coverimage'],
    },
    images: [String], //we will have a multiple images so array of strings
    createdAt: {
      type: Date,
      default: Date.now(), //represent current milliseconds in mongo it is converted to date
      select: false,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startDates: [Date], //tour starting dates we can pass like "2022-11-3,11:03 mongo will parse it as date"
    startLocation: {
      // GeoJSON
      // this object is not for schema type option. It is an embedded object we can sepecify properties
      type: {
        // this is schema type optioons
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //array of numbers First longitude then latitude. But in google map it is opposite
      address: String,
      description: String, //we dont want any of them to be required we allow startlocatio blank
    }, //Strat location is not really document itself
    // To create a document and embed them into another document we need to embed them into array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, //the day which user will go to this location . We can simply make first day as start location
      },
    ],
    // ------------EMBEDDING-----------------------
    // guides: Array, //we will get array of id of users and embed them into tour document

    // ------------CHILD REFERENCING---------------

    // TOURS AND USERS WILL REMAIN COPLETELY DIFFERENT ENTITIES
    guides: [
      //[] - means it is a subdocument inise a document
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', //for this we dont even want user to imported all the magic is done byy mongoose
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Now we created a schema

// ---------------------INDEX-----------------
// we can create index for specific field in collections
// MOngo automatically creates index for id
// this id index is ordered id that is stored somewhere outside collections
// Whenever documents are queried by this id mongoDb will serach through ordered indexes instead of searching through collection and look at all document
// So with index this process becomes much more efficient

// tourSchema.index({ price: 1 }); //1-ascending order, -1 - descending order
// after this output is

// "executionStats": {
//   "executionSuccess": true,
//   "nReturned": 3,
//   "executionTimeMillis": 1,
//   "totalKeysExamined": 3,
//   "totalDocsExamined": 3,
// so now only 3 documents are examined
// so with index now engine scan only three documents through index
// there is also index for name but we havent created it manually but how?
// becoz we have mentioned it as unique so mongo to ensure uniqueness of the field create a unique index for it
// This is called -----------------SINGLE FIELD INDEX--------------
// if we query combined then we create compound index
// let us get price and ratingsAverage
// "executionStats": {
//   "executionSuccess": true,
//   "nReturned": 2,
//   "executionTimeMillis": 0,
//   "totalKeysExamined": 3,
//   "totalDocsExamined": 3,

// Now total docs it examines is 3 but it return only 2
// it is also not efficient
// so create compound index
// these index take lot more space
// Which filed we need index?
// why we dont set index on all fields?
// Basically we need to carefully study/analyze access patterns in our app to figure out which fields are queried most and set index for it
// each index actually uses resourses each index need to be updated each time underlying collection is updated
// if we have collection with high write ratio then index has no use there

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// -------------GEOSPATIAL INDEX-------------
// for geospatial data index should be 2dsphere index
// we can also use 2d index
tourSchema.index({ startLocation: '2dsphere' });
// if you dont want index always delete it from db

// VIRTUAL PROPERTIES
// it will be not saved in database it is useful to not waste data in database
// we cant use virtual property in query

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// ----------------------VIRTUAL POPULATE---------
// we want to access reviews on specific tour so we are creating virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //foreign field is which field we want to referece in review model . That is tour field where we are referencing the parent tour
  localField: '_id', //local field - we are mentioning foreign field right so that reference where it is in our current model is _id becuase in forienkey we are storing just id in name of tour
});

// DOCUMENT MIDDLEWWARE

// REUNS BEFORE save(), create() but note on insertMany,insertbyid,...

tourSchema.pre('save', function (next) {
  // console.log('this is', this.summary); //this --> document that is currently going to save
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// --------------EMBEDDING--------------------

//when creatig new tour we would put guides id array
// so before saving into database we need to get the guide details from user collection and embed that into the database
// tourSchema.pre('save', async function (next) {
//   const guideusers = this.guides.map(async (id) => await User.findById(id));
//   // now our guideusers array is full of promises to run it use Pomise.all
//   this.guides = await Promise.all(guideusers);

//   // but now if tour guides is updated in user document then we also need to update tour doucmnet in which tour guide is there
//   // the best is to use child referencing
//   next();
// });

// after saving
// tourSchema.post('save', (doc, next) => {
//   //doc=> saved document
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE

// It only work for find not for findeOne, Findandupdate,....
// tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } }); //this--> currently executing query
//   next();
// });
// It only work for find not for findeOne, Findandupdate,....
// SOLUTION

// we can create for middleware for each we want
// tourSchema.pre('findOne', function (next) {
//   this.find({ secretTour: { $ne: true } }); //this--> currently executing query
//   next();
// });

// OR USE REGULAR EXPRESSION
// IT WILL EXECUTE THIS QUERY FOR ALL STARTING WITH FIND

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //this--> currently executing query

  // let us calculate time taken to execute query

  this.start = Date.now();
  // console.log(this.start);
  next();
});

// ----------------POPULATING-----------------
// it will up the field guides with the data that we refer
// only in query it populates not in database
// after this query we will have array of users that we refereced not just ids
// we need to populate it in getalltours too but we should not duplicate so in query middleware we cxan implement

// to select and deselct certain fields we can have some options
// populate will also perform query in backside that has hit in performance

tourSchema.pre(/^find/, function (next) {
  this.populate({
    //this referes to currrent  query
    path: 'guides', //the name of the field that we want to populate
    select: '-__v -passwordChangedAt',
  });
  next();
});

// POST MIDDLEWARE

tourSchema.post(/^find/, function (docs, next) {
  console.log(` query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs); //doc--> executed query docs
  next();
});

// AGGREGATION MIDDLEWARE
// Allows us to add hooks before or after an aggregation happens
// peviuosly we hide secret tours in query but it still there in aggregation
// to hide in aggregation....

tourSchema.post('aggregate', function (docs, next) {
  // console.log(this); //this--> referes to aggregate object
  // to get the array of aggregate pipeline
  // console.log(this.pipeline());
  // we have to add match aggregate in beg of this aggregate array
  // for that use unshift(to add at begininng of array)
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

// Now we can create a model out of it
// always use CAPITAL LETTER for MODEL

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
