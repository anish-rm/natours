const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Param middleware - runs only on certain parameters, when we have certain parameter inn url
// our example only parameter that we have is id
// router.param('id', (req,res,next,val) => { //val --> value of the id
//     console.log(`Tour id is ${val}`);
//     next();
// });

// By above we can go to tourrouter now and istead of checking
// invalid id in each controller we can check only once in the pipeline
// now below is no need becoz invalid id is handled by mongo itself
// router.param('id', tourController.invaidId);

// OR
// const {getAllTours} = req..  we can then use directly too
// all the object that we exported will be in this tourController variable

// const fs = require('fs');

// here we adding two.. becoz now our current directory is routes so we are telling go up one folder
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));//durname is the folder where currenbt script is located

// // we can put this routehandler in controller
// const getAllTours =  (req,res) => {
//     res.status(200).json({
//         // we are using jsend format
//         status: 'success',
//         simple: req.simple,
//         requestedAt: req.requestTime,
//         result : tours.length, //when we send multiple objects send the result too
//         data : {
//             tours : tours //suppose if we read in x then tours:x but key should be same as in url
//         }
//     });
// }

// const getTour = (req,res) => {
//     // :id is a variable
//     // we can have any number of variables like :id/:x/:y
//     // we have to specify otherwise error
//     // to make it optional :y?
//     // console.log(req.params);//params--> it will have all the variable that we declared
//     // nnow go to postman and run  /api/v1/tours/5  -->output {id:'5'}
//     const id = req.params.id *1;
//     // id is string we have to convert it to number. so when we multiply a string with 1 it will convert it to number
//     const tour  = tours.find(el => el.id === id); //ut will create aaary where vthis comparison is true
//     // if we req tour that not exists we have to send fail
//     if(!tour){
//         return res.status(404).json({ //return --> we want to exit the func right awat=y
//             status : 'fail',
//             message: 'Url not found'
//         })
//     }
//     res.status(200).json({
//         status : 'success',
//         data :{
//             tour
//         }
//     })
// }

// const createTour = (req,res) => {
//     // we can send the data from client to the server
//     // console.log(req.body);//we will send the data in body in postman for testing that data will be available on req abd we can send any rsponse to the client
//     // res.send('Done');
//     // now we need to modify the file(database here for us😂)
//     // we dont specify id in body becaue in db id will be automatically asinged
//     const newId = tours[tours.length-1].id + 1;
//     // object.assign allows us to create new object by merging existing object
//     const newTour = Object.assign({id: newId}, req.body);
//     // adding to the tours aray

//     tours.push(newTour);

//     fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours),err => { //we use stringify becoz tours is now array we need to convert it to json then only we are updating in file
//         res.status(201).json({
//             status: 'success',
//             simple:req.simple,
//             data: {
//                 tour: newTour
//             }
//         })
//     });
// }
// // we no need to restrat so file will be read only once .
// // because whenever the file is modified it automatically restarts te server so the top fileRead is done everytime when we restart the server.

// // name1='The Snow Adventurer';
// // const tour = tours.find(el => el.name === name1);
// // console.log(tour);

// const updateTour =  (req,res) => {
//     if(req.params.id > tours.length){
//         return res.status(404).json({ //return --> we want to exit the func right awat=y
//             status : 'fail',
//             message: 'Url not found'
//         });
//     }
//     console.log(req.body);
//     res.status(200).json({
//         status : 'success',
//         data : "<Updated here>"
//     })

// };

// const deleteTour = (req,res) => {
//     if(req.params.id > tours.length){
//         return res.status(404).json({ //return --> we want to exit the func right awat=y
//             status : 'fail',
//             message: 'Invalid Id'
//         });
//     }
//     res.status(204).json({ //here the status code is 204 --> no-content
//         status : 'success',
//         data : null //we will not send anything if we delete
//     })

// };

// --------------------Geospatial Queries------------------
// Assume you live in a certain point and you want to know tour starting point within 4km
router
  .route('/tours-within/:distance/center/:latlng/units/:unit')
  .get(tourController.getToursWithin);
// :distance - upto which distance we want.
// latlng - coordinates where we currently live
// unit - whether miles or kilometers
// tours-distance/233/center/-40,45/unit/mi

router.route('/distances/:latlng/units/:unit').get(tourController.getDistances);

// ---------------------NESTED ROUTES----------------------------------
// Now we manually pass tourid and userid and then create review
// but in real world userid should come from logged user and tourid from current tour and that should be encoded in url
// when creating review we want to post it to url like this

// POST/ tour/762578gvhg/reviews --> nested routes here we can see parent child relationship
// some other
// GET/ tour/762578gvhg/reviews
// GET/ tour/762578gvhg/reviews/i87t8bb --> specific review of tour

// router.route('/:tourId/reviews').post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview //actually it is counter intituitive because we are calling reveiwcontroller form tour
// );
// here review route is within tour route
// problem is it is messy
// so just route it to go to reviewroute
// console.log('hi');
router.use('/:tourId/reviews', reviewRouter);
// so now whenever user hits this url then we will say it to use reviewRouter
// now go there
// problem is this route dont get access to the tourId that we specify in this url
// we need to enable reviewRouter to access this parameter as well

//aliasing because we dont want user to enter url ?limit=5 & sort = -ratingsAverage,price
// we just want user to type top-5-cheap and we will prefill these fields
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
// we want tour to be used by all even other sites so no need to protect it
router
  .route('/') //we only want route here because tourRoter run on /api/v1/tours
  .get(tourController.getAllTours) //to protect getAllTours we need to allow users to access this route only if he log unsing middleware
  // chaing middleware
  // suppose if I want to check whether the data that coming in body is good req
  // first the middle ware will be checked and if that pass there next will be executed and craeteTour will be executes
  // it will be useful like we can check certain user is loggedin, etc...
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  // not all ussers can delete the tour
  // we need to authorize - verifying certain user is allowed to acces certain resourse even if he logged in
  // first middleware - to verify user is logged in
  // second middleware - we will pass which roles are allowed to delete tour and in middleware we will return true or false
  // if true then user can delete
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
