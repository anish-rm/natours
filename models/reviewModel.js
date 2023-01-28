const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    //this is for virtual properties not stored in database but  when we query it comes
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Each user can make review on specific tour only once
//  A tour must not have more than one review from same user
// One solution is we can set tour and user field to unique
// it is wrong because each tour can get only one review
// and each user can make only one review
// so we need to set combination of tour and user should be unique
// that is review with same tour and user should not come more than one
// so we can create commpound index with option unique:true
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// -------------------------CALCULATING REVIEW----------------------
// we have a average rating and number of rating in tour collection
// storing a summary of related data set in main data set is one technique
// it is helpful to prevent constant queries of related dataset
// when we query tours we dont need to query reviews and calculate average ratings each time
// we going to calculate average and nrating each time a review is added
// --------------------------STATIC  METHOD--------------------------
// this --> current model. We need to call aggreagate on the model so this.aggregate
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, //it picks all tour that matches tourId
    },
    {
      $group: {
        _id: '$tour', //it is the common field that all documents have that we want to groupby
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats[0].nRating);

  // to save them in thee tour collection
  // if -> when we deleted last review of specific tour then after executing that there will be nor review on database ont that tourId
  // so our stats will be empty in that case we want to set it to default
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current document
  // how to call the below function
  // we have to call like Review.calcAvereageRtaings
  // problem is we dont have Review keyword defined anywhere
  // so use this.constructor --> points to the model
  // we should not use pre becoz then document will not be saved to db so aggregate cant match
  // So use post
  this.constructor.calcAverageRatings(this.tour);
});

// -------------------CALCULATING REVIEW WHEN UPDATED AND DELETED------------------
// we usually update or delete using:
// findbyIdandUpdate
// findbyIdandDelete
// we dont have access to document in query middleware
// to get access to document in query middleware
// findOneAnd - for both findbyIdandUpdate and findbyIdandDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // const r = await this.findOne();
  // // now in r we will have current document that we are updating or deleting
  // console.log(r);

  // // but here still the old rating only will be available because it is pre it will not be saved in database
  // // so we cant use post because at that time query will be executed then we wont have access to query and we cant get access to doc
  // // so solution is...............
  // by saving it to this.r we will have access to this in post middleware also
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

// this is the best place where we can call aggregate func because data will be saved
// but how to get access the document
// -------------------TRICK-------------
// we need to pass the data from pre to post middleware
// in pre we can save to this.r then we will have access to this in post also
reviewSchema.post(/^findOneAnd/, function () {
  this.r.constructor.calcAverageRatings(this.r.tour); //this.r --> current doc , this.r.tour--> current doc's tourid
  // this.r --> current doc, this.r.constructor --> current docs model
  // we need to await it
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
