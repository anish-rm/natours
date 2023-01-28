const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(Model);
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

//updating

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //it will return a updated document otherwise it will send aa old document
      runValidators: true, //if it is true then validartors in schema will be checked again
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// Creating

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//gettiing
// it somewhat trickier becoz we have populate in tour
// so we can add popOptions if it is there then we can populae otherwise we can skip it....
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    // it is similar to api features
    // first we can chain query and finally only we can await it

    const doc = await query;

    if (!doc) {
      return next(new AppError('That ID is not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// getAll factory function
// all three resources will get Api feauters so we create a common handler with all apiFeatures
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // the below is for not all getAll it is only reviews
    // but it does not affect others so we can add here to make it simple
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // ----------------EXPLAIN()--------------
    // "executionStats": {
    //   "executionSuccess": true,
    //   "nReturned": 3,
    //   "executionTimeMillis": 1,
    //   "totalKeysExamined": 0,
    //   "totalDocsExamined": 9,
    // we can see here that mongodb examines all (9) docs to get price[lt] = 1000 and return only 3 docs
    // it is not efficient if we have millions of documents then it will go through millions
    // so only we use indexes

    // ---------------------INDEX-----------------
    // we can create index for specific field in collections
    // MOngo automatically creates index for id
    // this id index is ordered id that is stored somewhere outside collections
    // Whenever documents are queried by this id mongoDb will serach through ordered indexes instead of searching through collection and look at all document
    // So with index this process becomes much more efficient

    // SEND RESPONSE
    res.status(200).json({
      // we are using jsend format
      status: 'success',
      simple: req.simple,
      requestedAt: req.requestTime,
      results: doc.length, //when we send multiple objects send the result too
      data: {
        data: doc, //suppose if we read in x then tours:x but key should be same as in url
      },
    });
  });
