const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // steps to render this page
  // 1. get tour data from collection
  const tours = await Tour.find();
  console.log(tours[0].startDates[0].toLocaleString());
  // 2. build templates
  // 3.Render that template using tour data from step 1.
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('overview', {
      title: 'All Tours',
      tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get the data of specific tour including guides and reviews
  // find - returs a array
  // findone return one object
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // if there is no route there should be error
  if (!tour) {
    return next(new AppError(' There is no tour with that name'));
  }

  // 2.Build template
  // 3.render template using data
  // console.log(tour);
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://js.stripe.com/v3/;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.login = (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
      title: 'Login',
    });
};

exports.getAccount = (req, res) => {
  console.log(req.cookies);
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('account', {
      title: 'Your Account',
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // we will never update pwd with this findandupdate
  // we will never save so pwd will not be encrypted
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, //it will return updated data
      runValidators: true,
    }
  );
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('account', {
      title: 'Your Account',
      user, //we need to pass updated user otherwise it will use the old user data
    });
});
