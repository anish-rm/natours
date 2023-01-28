const path = require('path');
const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// to access cookie we need to install cookie-parser
// it parses all the cookies from the incoming request
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

const app = express();

// -----------------TEMPLATE ENGINE--------------
// we are going to use pug it is a template engine commomly used in express
app.set('view engine', 'pug');
// to set locations
app.set('views', path.join(__dirname, 'views'));

// ----------------SERVING STATIC FILES-------------------------------------
// static file - files that are sitting in our file systemwe cannot access that using our route
// if we type in url /public/overview.html it wont work
// so we use built in middleware

// so if we type only overview.html we will get that page
// why we no need public?
// when we open a url that we cant find in any of the route it will lokk in the public folder that we defined
// it sets the public to the root
// in console lot of things(404 error)

// each piece that is part of website gets a separate request

// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// 1.GLOBAL Middlewares -------------------------------------

// Everyone using express must always use helmet package
// Becoz express doesn't use all best security
// always put it right in the beginning

// 1.SECURITY HTTP HEADERS
// It uses default you can also set active others too by using documentation
app.use(helmet());
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ['none'],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: ["'self'", 'data:', 'blob:'],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: [
          "'self'",
          'blob:',
          'wss:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Development Logging

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// LIMIT REQUEST FROM API

const limiter = rateLimit({
  max: 100, //how many request
  windowMs: 60 * 60 * 1000, //1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
  // in one hour client can send only 100 requests else it will block it
});

// Limit access to all api routes
// if app is restarted then again limit will start from beg
// so our app cannot crash otherwise it will reset the limit
app.use('/api', limiter);

//3. BODY PARSE, READING DATA FROM BODY INTO REQ.BODY

// LIMITING REQUESTS
app.use(express.json({ limit: '10kb' }));
// it is necessary because if we send data from we can acccess by only through this middleware
// it parse data coming from url encoded
// now we can data using req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); //both above are same above parses data from body and this parses data from cookie

app.use(morgan('dev'));
// to understand how works go to the github page of morgan and it  will have req,res,next same like our own middleware
// like dev there are others just use ' ' and wait vs code will show all available

// 4.DATA SANITIZATION

// Data sanitization against NoSQL query injection

// Consider the example
// {
//   "email": { "$gt": "" },
//   "password": "newpass1234"
// }

// It will log in without even knowing the email
// This works because this query will be always true so if we enter correct password we will be enterd
// To protect against
// install npm i express-mongo-sanitize and npm i xss-clean

app.use(mongoSanitize());

// Data sanitizatio against XSS
// clean any user input malicous html code
app.use(xss());

// suppose if i signup like this then the result will be
// {
//   "name": "<div id='badcode'>tester</div>",
//   "email": "user2@gmail.com",
//   "password": "pass1234",
//   "passwordConfirm": "pass1234",
//   "role": "guide"
// }

// "name": "&lt;div id='badcode'>tester&lt;/div>",

// 5.PARAMETER POLLUTION

// {{URL}}/api/v1/tours/sort=duration&sort=price
// if we give like this it will give error
// because we can pass sort = duration,price and we are splitting it as .split(',')
// So here there is error
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuality',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// now if there is two sort it takes last sort
// sometimes we want duplicates like
// {{URL}}/api/v1/tours?duration=5&duration=9
// so we can whitelist

// 6.TEST MIDDLEWARE

// own middleware function
// this will be executed for all requested . Remember to alwys put next
app.use((req, res, next) => {
  // Error in express middleware will go directl to the error handler and will send response what we defined there
  // console.log(x);
  console.log('Hello from the middleware👋👋');
  // console.log(req.headers);
  next();
});

// manipulating req with our own middleware
app.use((req, res, next) => {
  req.simple = req.body;
  next();
});

// adding time to all req
// we used trhis in getAllTours
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
// suppose if we put after our one of the app route go down ...............

// 2.Route Handlers-----------------------------
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

// // Route handlers for Users resource

// const getAllUsers = (req,res) => {
//     res.status(500).json({ //500-internal server error because currently we have not implemented this route
//         status : 'error',
//         message: 'This route is not yet defined'
//     });
// };

// const createUser = (req,res) => {
//     res.status(500).json({ //500-internal server error because currently we have not implemented this route
//         status : 'error',
//         message: 'This route is not yet defined'
//     });
// };

// const getUser = (req,res) => {
//     res.status(500).json({ //500-internal server error because currently we have not implemented this route
//         status : 'error',
//         message: 'This route is not yet defined'
//     });
// };

// const updateUser = (req,res) => {
//     res.status(500).json({ //500-internal server error because currently we have not implemented this route
//         status : 'error',
//         message: 'This route is not yet defined'
//     });
// };

// const deleteUser = (req,res) => {
//     res.status(500).json({ //500-internal server error because currently we have not implemented this route
//         status : 'error',
//         message: 'This route is not yet defined'
//     });
// };

// middleware that put the body data into the req so we can access like req.body. It will modify incoming JSON data. Now the data from body will be added to the req

// // now routing
// app.get('/', (req, res) => {
//     // res.status(200).send('Hello from the server side!');
//     res.status(200).json({message: 'Hello from the server side', app: 'Natours'})
// })

// app.post('/', (req, res)=>{
//     res.send('You can post to this url');
// })

// first we can read the file outside not inside callback so it may block
// we have read this in tourRouter file
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));//durname is the folder where currenbt script is located
// if user go to this url(request hits us) we will send json data

// and this callbacvk is called route handler

// now we can create func intsead of inside here
// app.get('/api/v1/tours', getAllTours);
// now goto postman and test

// to respond to url parameter
// app.get('/api/v1/tours/:id', getTour);

// to post(add tour)
// app.post('/api/v1/tours', createTour);

// patch it will updat only the property of an object
// app.patch('/api/v1/tours/:id',updateTour);

// deleting a tour
// app.delete('/api/v1/tours/:id', deleteTour);

// now if we want to change the api version we have to update in each . Instead of this

// Another way of above is

// see the above comments first

// 3.Routes-----------------------
// app
//     .route('/api/v1/tours')
//     .get(getAllTours)
//     .post(createTour);

// own middleware
// if we req for above url then this middleare will not run
// becoz it will end the req, res cycle by sending the final response
// but if we hit req ath below url then we will get this middleware
// so the order is very very important

//But alwys put middleware at top

// app.use((req,res,next) => {
//     console.log("Hello from the middleware👋👋");
//     next();
// });

//two urls are diff so only we are separating it
// app
//     .route('/api/v1/tours/:id')
//     .get(getTour)
//     .patch(updateTour)
//     .delete(deleteTour);

// now implementing routes for users resourse

// app
//     .route('/api/v1/users')
//     .get(getAllUsers)
//     .post(createUser);

// app
//     .route('/api/v1/users/:id')
//     .get(getUser)
//     .patch(updateUser)
//     .delete(deleteUser);

// now we can mount the routers
// Every route is in app it is not manageble
// so we should have a file for tours route
// another file for users route
// anothe file for tours routehandler
// anothe file for users routehandler

// all our routes are on same router --->> app
// to separate them create one router for each resource

// MOUNTING-----------------------------------------

// Creating a new router for tour
// const tourRouter = express.Router();
// const userRouter = express.Router();

// // how we connect them with our app?
// // app.use('/api/v1/tours',tourRouter); //when the requset hits the server with api/v1/tours it will match this midleware stack and go to the tourRouter and in that it will match correct router . If/:id it will match second and in that suitable method
// // app.use('/api/v1/users',userRouter);
// // and now these has to be in bottom because mounting has to come after all of these definitions
// // we want to use our tourRoter on api /api/v1/tours

// tourRouter
//     .route('/')  //we only want route here because tourRoter run on /api/v1/tours
//     .get(getAllTours)
//     .post(createTour);

// tourRouter
//     .route('/:id')
//     .get(getTour)
//     .patch(updateTour)
//     .delete(deleteTour);

// userRouter
//     .route('/')
//     .get(getAllUsers)
//     .post(createUser);

// userRouter
//     .route('/:id')
//     .get(getUser)
//     .patch(updateUser)
//     .delete(deleteUser);

// these all are implemented in separate file

// PARAM MIDDLEWARE
// app.param(['id', 'page1'], (req, res, next, value) => {
//     console.log('CALLED ONLY ONCE with', value)
//     next()
// })
// console.log("hee");

// app.get('/api/v1/tours/:id/:page', (req, res) => {
//   console.log('and this matches too');
//   res.end();
// });
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker', //we can pass data to pug template that we can use there
//     user: 'jonas',
//   }); // we no nee to mention extension express automatically know
//   // it will look for this file inside folder that we specified  at beginning
//   // then it takes that render it and sends res to browser
//   // now when we type localhost:8000 this will be rendered
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker',
//   });
// });

//above is in Viewroutes

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use('/', viewRouter);

// TO HANDLE UNHANDLED ROUTES like if user entered wrong url then this middleware would be executed
// If not this midd then it will return a html page with 404 but we want to send json
// all -> to handle get,post,patch,put,etc
// * -> tany query enetered by user
// req.originalUrl -> the url currently enetered
// app.all('*', (req, res, next) => {
//   res.status(404).json({
//     status: 'fail',
//     message: `Can't find ${req.originalUrl} not found`,
//   });
// });

// CREATING GLOBAL ERROR
// Two steps 1.create middleware 2.introduce error

// STEP2

// Now we can create by creating cclass so no need to rewrite code. go to utils

app.all('*', (req, res, next) => {
  // To create error
  // const err = new Error(`Can't find ${req.originalUrl} on server`);
  // err.statusCode = 404;
  // err.status = 'failed';
  //if next recieves argument , express assumes that it is an error. It skips all middleware below and go to global error handling middleware
  // Global middlewaare is identified by express by if middleware has 4 arg then it is global error handling middleware
  // next(err);
  // After we craeted clas for creating error
  // const err = new AppError(`Can't find ${req.originalUrl} on server`, 404);
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on server`, 404));
});

// STEP1

app.use(
  //(err, req, res, next) => {
  // There is two type one 4 strarting error like 400,404, these are failed
  // Another is 500 error that is internal server error
  // err.statusCode = err.statusCode || 500;
  // err.status = err.status || 'error';
  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message, //no need to initiaize message because we directly passing like new Error('meaasage')
  // });
  // }
  globalErrorController
);

// we can pt this error controller in controller

// it will be in server.js
// 4.staring the server---------------
// const port=8000
// app.listen(port, () => {
//     console.log(`App running on port ${port}`);
// })

module.exports = app;
