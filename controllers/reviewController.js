const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   // we usually get onl reviewws of specific tour so we are merging the url for tourId
//   // console.log("e:",Review);
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

exports.getAllReview = factory.getAll(Review);

// exports.createReview = catchAsync(async (req, res, next) => {
//   // if there is no user id and tour id we are going to create it based on tourId parameter and userid that we get from protect middleware
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user;
//   const newReview = await Review.create(req.body);

//   console.log('parameter:', req.params);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

// Now to use factory handler for creating there is a problem becoz we are checking whether there is req.params.tourId and userId
// so we can create middleware that checks this and then we create handler function

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user;
  next();
};

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);

// all these delete handller look same
// we are duplicating code in all controllers
// so instead of doing this we can create factory function that will be genearlized we just need to send model and it will delete
// it is a function that returns another function

exports.deleteReview = factory.deleteOne(Review);

// for updating
exports.updateReview = factory.updateOne(Review);
