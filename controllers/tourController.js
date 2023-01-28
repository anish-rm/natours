/* eslint-disable no-unused-vars */
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
// const { features } = require('process');
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
// this way image will be stored as buffer

const multerFilter = (req, file, cb) => {
  // to check if uploaded file is image
  // we can also write code for csv file
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// multer is used to handle multi-part form data
// now it will save img to public/img/users
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// creating middleware out of this upload
exports.uploadTourImages = upload.fields([
  //here the situation is we can upload even one img and also three images
  { name: 'imageCover', maxCount: 1 }, //here the field with imageCover can have only img upload
  { name: 'images', maxCount: 3 },
]);

// suppose if we only have mutiple img upload then....
// upload.array('images', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files.images);
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // 1.) COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // to access in update handler
  await sharp(req.files.imageCover[0].buffer) //we can use like this becoz we are saving image bufferas memory in multer storage
    .resize(2000, 1333) // to crop it as square
    .toFormat('jpeg') // to convert it to jpeg
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); //to save it into our file storage

  // 2.) IMAGES
  req.body.images = [];
  // we have async await ionly inside this for . It wont stop code from going to next line
  // so we can use map for that becoz then we will have array of promises and we can use promise.all to await all of them
  // so now we will wait until all this image processing is done
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(req.files.images[i].buffer) //we can use like this becoz we are saving image bufferas memory in multer storage
        .resize(500, 500) // to crop it as square
        .toFormat('jpeg') // to convert it to jpeg
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  // await sharp(req.file.buffer) //we can use like this becoz we are saving image bufferas memory in multer storage
  //   .resize(500, 500) // to crop it as square
  //   .toFormat('jpeg') // to convert it to jpeg
  //   .jpeg({ quality: 90 })
  //   .toFile(`public/img/users/${req.file.filename}`); //to save it into our file storage
  next();
});
// we need to export here but we need to expost all these functions
// we now put all these function in export
// here we adding two.. becoz now our current directory is routes so we are telling go up one folder
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// ); //durname is the folder where currenbt script is located

// we can put this routehandler in controller

//Below is no need becoz mongo take care of invalid id
// exports.invaidId = (req, res, next, val) => {
//   if (val * 1 > tours.length) {
//     return res.status(404).json({
//       //return --> we want to exit the func right awat=y
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   // it wont come to next if we return so res will not be
//   // sent twice so no error
//   // Remeber response shoulb be sent only once
//   next();
// };

// MULTIPLE MIDDLEWARE------------
// midddleware to cheeck good req{
// exports.checkBody = (req, res, next) => {
//   if (req.body.name && req.body.price) {
//     next();
//   } else {
//     return res.status(400).json({
//       status: 'Bad Request',
//       message: 'Name or Price is missing',
//     });
//   }
// };

// we are prefilling limit,sort,fields so user dont want to type everything. User can just type top-5-cheap and we will prefill these data
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// NOW THIS IS IN UTILS FOLDER

// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   filter() {
//     // BUILD QUERY
//     // eslint-disable-next-line node/no-unsupported-features/es-syntax
//     const queryObj = { ...this.queryString }; //we are putting like this to avoid direct reference to object
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // we have to remove these fields from the query
//     excludedFields.forEach((el) => delete queryObj[el]);
//     let queryStr = JSON.stringify(queryObj);
//     // regular exp to replace
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //g-replace all with gt,gte if it not then only first ocuurance will be replaced, \b-we only want to match these exct words not like agtekj if not \b then this wil be matched
//     console.log(JSON.parse(queryStr));

//     this.query = this.query.find(JSON.parse(queryStr));
//     // let query = Tour.find(JSON.parse(queryStr));
//     return this;
//   }

//   sort() {
//     if (this.queryString.sort) {
//       //if there is sort word in our url this will be executed
//       // query = query.sort(req.query.sort); //mongoose will automatically sort it with what value we give to sort. Suppose sort:price then it will sort the price from lowest to highest
//       // supoose if two prices are same then how it will sort?
//       // we can specify second field so if prices are same then it will sort based on second field
//       // in mongoose format sort('price ratingsAverage')
//       // IN url just give ?sort=price,ratingsAverage
//       // now take the sort value remove , and add " "
//       const sortBy = this.queryString.sort.split(',').join(' ');
//       this.query = this.query.sort(sortBy);
//       console.log(sortBy);
//     } else {
//       //default one
//       // newly created query first
//       this.query = this.query.sort('-createdAt');
//     }
//     return this;
//   }

//   limit() {
//     if (this.queryString.fields) {
//       const fields = this.queryString.fields.split(',').join(' ');
//       this.query = this.query.select(fields);
//     } else {
//       this.query = this.query.select('-__v'); //- means exclude it and fetch all
//     }
//     return this;
//   }

//   paginate() {
//     const page = this.queryString.page * 1 || 1; //if req.querypage exists then that will be taken or 1 is default
//     const limit = this.queryString.limit * 1 || 100;
//     const skip = (page - 1) * limit; //formula to calculate the skip

//     this.query = this.query.skip(skip).limit(limit);
//     return this;
//     // if user asks for page that does not exist then no tour will be returned
//   }
// }

// exports.getAllTours = async (req, res) => {
//   try {
//     // 1.FILTERING.......
//     // we have to get only the query becoz ?duration=5&pag=3 here page=3 is not query
//     // BUILD QUERY
//     // eslint-disable-next-line node/no-unsupported-features/es-syntax
//     // const queryObj = { ...req.query }; //we are putting like this to avoid direct reference to object
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // // we have to remove these fields from the query
//     // excludedFields.forEach((el) => delete queryObj[el]);

//     // after ? will be considered as query and req.query will parse tehm into a nice object

//     // It returns an array of object and automatically covert to jsobject

//     // NORMAL WAY
//     // const tours = await Tour.find({
//     //   duration: 5,
//     //   difficulty: 'easy',
//     // });
//     // const tours = await Tour.find(req.query);
//     // const tours = await Tour.find(queryObj); //it will return a query
//     // when we execute above then query willl wxecute for find and come back wiith docs matches as our query
//     // later we cant implement sorting, pagination....
//     // we have to put that find part in query and onlu in the end we need to await the query

//     // CORRECT WAY TO QUERY FOR SORTING,PAGINATION,ETC
//     console.log(req.query);
//     // // BUILD QUERY
//     // // eslint-disable-next-line node/no-unsupported-features/es-syntax
//     // const queryObj = { ...req.query }; //we are putting like this to avoid direct reference to object
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // // we have to remove these fields from the query
//     // excludedFields.forEach((el) => delete queryObj[el]);
//     // const query = Tour.find(queryObj);

//     // 2.ADVANCED FILTERING

//     // WAY TO QUERY GTE IN MONGO
//     // {difficulty: 'easy', duaration: {$gte: 5}}

//     // in postman
//     // /api/v1/tours?difficulty=easy&duration[gte]=5

//     // in console
//     // { difficulty: 'easy', duration: { gte: '5' } }
//     // IT IS IDENTICAL TO QUERY IN MONGO EXCEPT $ IS MISSING

//     // let us just replace gte with $ before

//     // CONVERT OBJECT TO STRING
//     // let queryStr = JSON.stringify(queryObj);
//     // // regular exp to replace
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //g-replace all with gt,gte if it not then only first ocuurance will be replaced, \b-we only want to match these exct words not like agtekj if not \b then this wil be matched
//     // console.log(JSON.parse(queryStr));

//     // let query = Tour.find(JSON.parse(queryStr));
//     // Another method
//     // const query = await Tour.find()
//     //   .where('duration')
//     //   .lte(5)
//     //   .where('difficulty')
//     //   .equals('easy');

//     // 3.SORTING
//     // if (req.query.sort) {
//     //   //if there is sort word in our url this will be executed
//     //   // query = query.sort(req.query.sort); //mongoose will automatically sort it with what value we give to sort. Suppose sort:price then it will sort the price from lowest to highest
//     //   // supoose if two prices are same then how it will sort?
//     //   // we can specify second field so if prices are same then it will sort based on second field
//     //   // in mongoose format sort('price ratingsAverage')
//     //   // IN url just give ?sort=price,ratingsAverage
//     //   // now take the sort value remove , and add " "
//     //   const sortBy = req.query.sort.split(',').join(' ');
//     //   query = query.sort(sortBy);
//     //   console.log(sortBy);
//     // } else {
//     //   //default one
//     //   // newly created query first
//     //   query = query.sort('-createdAt');
//     // }

//     // 4.FIELD LIMITING
//     // we can limit the data to reduce bandwidth in a request
//     // IN URL
//     // l
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' ');
//     //   query = query.select(fields);
//     // } else {
//     //   query = query.select('-__v'); //- means exclude it and fetch all
//     // }

//     // 4.PAGINATION

//     // api
//     // /tours?page=2&limit=10  We want 2nd page and page shuld have 10 docs
//     // query = query.skip(10).limit(10); //since we want 2nd page first 10(limit) docs have to be skiped. If page 3, then first 20 docs....

//     // const page = req.query.page * 1 || 1; //if req.querypage exists then that will be taken or 1 is default
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit; //formula to calculate the skip

//     // query = query.skip(skip).limit(limit);

//     // if user asks for page that does not exist
//     // if (req.query.page) {
//     //   const numTours = await Tour.countDocuments();
//     //   if (skip >= numTours) throw new Error('This page does not exist'); //sinnce we are executing in try block now this will go to catch block
//     // }

//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour, req.query)
//       .filter()
//       .sort()
//       .limit()
//       .paginate();
//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       // we are using jsend format
//       status: 'success',
//       simple: req.simple,
//       requestedAt: req.requestTime,
//       results: tours.length, //when we send multiple objects send the result too
//       data: {
//         tours, //suppose if we read in x then tours:x but key should be same as in url
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

// Factory handlers for getAllTours
exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//   // :id is a variable
//   // we can have any number of variables like :id/:x/:y
//   // we have to specify otherwise error
//   // to make it optional :y?
//   // console.log(req.params);//params--> it will have all the variable that we declared
//   // nnow go to postman and run  /api/v1/tours/5  -->output {id:'5'}
//   // const id = req.params.id * 1;
//   // id is string we have to convert it to number. so when we multiply a string with 1 it will convert it to number
//   // const tour = tours.find((el) => el.id === id); //ut will create aaary where vthis comparison is true
//   // if we req tour that not exists we have to send fail
//   // if(!tour){
//   //     return res.status(404).json({ //return --> we want to exit the func right awat=y
//   //         status : 'fail',
//   //         message: 'Url not found'
//   //     })
//   // }
//   // try {
//   //   const tour = await Tour.findById(req.params.id);
//   //   // Tour.findOne({_id : req.params.id})  It works same as above

//   //   // suppose if I enter invalid id it will  give tour:null and 200 ok
//   //   // but we have to ruturn 404 error so

//   //   // if tour is null it will go into this
//   //   // we are initializing by sending it to AppError class
//   //   // after that we are sending this error to next it will go to global error handler

//   //   if (!tour) {
//   //     return next(new AppError('That ID is not found', 404));
//   //   }

//   //   res.status(200).json({
//   //     status: 'success',
//   //     data: {
//   //       tour,
//   //     },
//   //   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Could no able to fetch',
//   //   });
//   // }

//   // -------------POPULATING---------------------
//   // it will up the field guides with the data that we refer
//   // only in query it populates not in database
//   // after this query we will have array of users that we refereced not just ids
//   // we need to populate it in getalltours too but we should not duplicate so in query middleware we cxan implement

//   // to select and deselct certain fields we can have some options
//   // populate will also perform query in backside that has hit in performance
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides', //the name of the field that we want to populate
//   //   select: '-__v -passwordChangedAt',
//   // });

//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     return next(new AppError('That ID is not found', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

// getTour with factory handler
// here { path: 'reviews' } is the popOptions that we will use in handler
// if we send this then we will populate otherwise we will not populate
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// Let us catch async error now

// first we are passing our async to a catchAsync function. cathchAsync function will execute our async here and return this back to createTour.
// And when we execute it will return a promise if there is error we are catching and sending into global error conntroller
// because next with argument will skip the below middleware and go straight global error handling middleware
//global error handler will have 4 arguments
// now we can put this im separarete file in utils

// eslint-disable-next-line arrow-body-style
// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch((err) => next(err));
//   };
// };

// exports.createTour = catchAsync(async (req, res) => {
//   // we can send the data from client to the server
//   // console.log(req.body);//we will send the data in body in postman for testing that data will be available on req abd we can send any rsponse to the client
//   // res.send('Done');
//   // now we need to modify the file(database here for us😂)
//   // we dont specify id in body becaue in db id will be automatically asinged
//   // const newId = tours[tours.length - 1].id + 1;
//   // // object.assign allows us to create new object by merging existing object
//   // // eslint-disable-next-line node/no-unsupported-features/es-syntax
//   // const newTour = { id: newId, ...req.body };
//   // // adding to the tours aray
//   // tours.push(newTour);
//   // fs.writeFile(
//   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   JSON.stringify(tours),
//   //   (err) => {
//   //     //we use stringify becoz tours is now array we need to convert it to json then only we are updating in file
//   //     res.status(201).json({
//   //       status: 'success',
//   //       simple: req.simple,
//   //       data: {
//   //         tour: newTour,
//   //       },
//   //     });
//   //   }
//   // );
//   // Creating Documents
//   // 1.one way
//   // const newTours = new Tour({});
//   // newTours.save();

//   // 2.way
//   // it returns a promise
//   // instead of then we are using async await
//   // try {
//   //   // if it was rejected it will go to catch block
//   //   const newTour = await Tour.create(req.body);

//   //   res.status(201).json({
//   //     status: 'success',
//   //     data: {
//   //       tour: newTour,
//   //     },
//   //   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

// Factory function for creating tour

exports.createTour = factory.createOne(Tour);

// we no need to restrat so file will be read only once .
// because whenever the file is modified it automatically restarts te server so the top fileRead is done everytime when we restart the server.

// name1='The Snow Adventurer';
// const tour = tours.find(el => el.name === name1);
// console.log(tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   // if(req.params.id > tours.length){
//   //     return res.status(404).json({ //return --> we want to exit the func right awat=y
//   //         status : 'fail',
//   //         message: 'Url not found'
//   //     });
//   // }
//   // try {
//   //   // updating
//   //   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//   //     // options refer documentaion for more options and more methods
//   //     new: true, //it will return a updated document otherwise it will send aa old document
//   //     runValidators: true, //if it is true then validartors in schema will be checked again
//   //   });
//   //   res.status(200).json({
//   //     status: 'success',
//   //     data: {
//   //       tour,
//   //     },
//   //   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Could no able to update',
//   //   });
//   // }
//   // console.log(req.body);
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     // options refer documentaion for more options and more methods
//     new: true, //it will return a updated document otherwise it will send aa old document
//     runValidators: true, //if it is true then validartors in schema will be checked again
//   });
//   if (!tour) {
//     return next(new AppError('That ID is not found', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

// Handler to update

exports.updateTour = factory.updateOne(Tour);

// all these delete handller look same
// we are duplicating code in all controllers
// so instead of doing this we can create factory function that will be genearlized we just need to send model and it will delete
// it is a function that returns another function

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = async (req, res) => {
//   // if(req.params.id > tours.length){
//   //     return res.status(404).json({ //return --> we want to exit the func right awat=y
//   //         status : 'fail',
//   //         message: 'Invalid Id'
//   //     });
//   // }
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(200).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: 'Could no able to delete',
//     });
//   }
//   // console.log(req.body);
// };

// AGGREGATION

// WE CAN DO LIKE SUM,AVG,MIN,MAX,ETC.......

// refer docs for more info

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: 4.5 }, //it is just a preliminary it will fetch documents above ratings average 4.5
      },
      {
        $group: {
          // _id: null, //this field is import to mention by which field we want to group
          // if null --> then group all documents
          _id: null, //just convert to uppercase
          // _id: '$ratingsAverage',
          numTours: { $sum: 1 }, //whenever it go through a document one will be added to the numTour
          numRating: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, //we need to use names in group
      }, //we can also repeat stages
      // {
      //   $match: { _id: { $ne: 'EASY' } }, //it is just a preliminary it will fetch documents above ratings average 4.5
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Could no able to delete',
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    console.log(year);
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTours: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Could no able to delete',
    });
  }
};

// -------------------GEOSPATIAL QUERIES----------------------
// tours-distance/233/center/34.111745,-118.113491/unit/mi
// the above latlng is coordinate of losangeles
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // we are destructing here...es6 features
  const { distance, latlng, unit } = req.params;
  // we accept lat and lng in above format
  // we can split it now
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitutde in the format lat,lng',
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);
  // now let us query.....
  // suppose if we mentioned 250 miles then we want to find all tour within 250 miles circle from center(given lat, lon)
  // this only we are mentioning it as $geowithin
  // first is always lng and only lat

  // and we need to pass radius in radians
  // to get radians divide distance by radius of the earth
  // radius of earth is different in miles and km
  // inorder to execute geospatial query first we have to create index on field where geospatial data that we're seraching is stored
  // go to tour model for geoospatial index
  // go and analyze in compass
  // we can go to startLocation and see map there

  // TO VERIFY
  // click the point that you queried and drag for 400 miles as you queried and see results
  // you will get exactly the same result even in find search box we can see exactly same query as down
  // {startLocation: {$geoWithin: { $centerSphere: [ [ -117.31487905349469, 34.197624312387596 ], 0.11271130509478298 ]}}}

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  console.log(radius);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// To calculate distance from certain point to all tourss starting point
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  // we accept lat and lng in above format
  // we can split it now
  const [lat, lng] = latlng.split(',');

  // if miles then we need result in miles or kms
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitutde in the format lat,lng',
        400
      )
    );
  }

  // we do calculation in aggregate pipeline

  const distances = await Tour.aggregate([
    // only one single stage and this should always need to be the first one in pipeline
    // it requires atleast one field should have geoindex
    // ad we have startLocation so it uses this to calculate distance
    // i fwe have more then we have to use key (refer docs)
    {
      $geoNear: {
        // this near here is from which point we need to calculate distance b/w all starting points
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', // this is name of filed that will created thatw ill have calculated distances
        // it will return only in meteres to convert it to km/miles
        // distanceMultiplier: 0.001, //like we are dividing it by 1000
        distanceMultiplier: multiplier,
      },
    },
    {
      // it will return all fields
      // to select only specific field
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
