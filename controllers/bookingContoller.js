// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //it will expose a func and we are passing secret key into that
const Stripe = require('stripe');

// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

// exports.getCheckOutSession = catchAsync(async (req, res, next) => {
//   // 1.) Get the currently booked tour
//   const tour = await Tour.findById(req.params.tourId);

//   //   2) Create checkout session
//   // install stripe
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     success_url: `${req.protocol}:://localhost:8000/`, //when success the user will redirected to this url
//     cancel_url: `${req.protocol}:://localhost:8000/tour/${tour.slug}`,
//     customer_email: req.user.email,
//     // client reference id
//     // to pass in data about session we are currently creating
//     // later once payment is successful we will get access to this again
//     // then we have to create a new booking in db
//     // to ccreate a new booking we will need the user id, tour id and pricce
//     client_reference_id: req.params.tourId,
//     line_items: [
//       // it accepts array of objects
//       {
//         name: `${tour.name} Tour`, // name of the product
//         description: tour.summary,
//         images: [`http://localhost:8000/img/tours/${tour.imageCover}`],
//         amount: tour.price * 100, //here we are converting to cents
//         currency: 'INR',
//         quantity: 1,
//       },
//     ],
//   });

//   // 3 Create session as response
//   res.status(200).json({
//     status: 'success',
//     session,
//   });
// });

// check comments above
// it has to be done this way

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create Checkout session
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'INR',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3) Create Session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
