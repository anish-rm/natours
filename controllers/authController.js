const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // HTTP WEB TOKEN SHOULD BE ONLY STORED IN A SECURE HTTP-only cookie
  // Snding token as a cookie
  // cookie is just a small piece of text that server send to client
  // client will save it and send it for all future req
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //after th data we mentioned the client will delete it
    // secure: true, //by setting this cookie will only be sent over encryped connection
    httpOnly: true, //cookie cannnot be accessed or modified in any way by the browser
  };
  // first para - name, second - data, third - options
  res.cookie('jwt', token, cookieOptions);

  //Currently it wouldn't be work becoz we are not currently using HTTPS because of secure: true cookie will not created

  // we want to set this only in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // we made password select: false
  // But whenever we signup it password also showing
  // sso to fix this
  // console.log(res.cookie);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  // The problem here is anyone can manually set the role as admin
  // so to fix this

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
  });

  // FOR SENDING EMAIL
  // const url = `${req.protocol}://${req.get('host')}/me`;
  const url = `${req.protocol}://localhost:8000/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  // now we will accept only these data even if user set role as admin we wont accept it
  // if we want to set someone as admin we can go to mongo compass change the role

  // Now when user sign we need to login him to the application

  // For that we will use JSON WEB TOKEN - JWT

  // STEP 1: SIGN A JWT AND SEND IT BAXK TO USER

  // WE NO NEED TO CHECK PASWORD AS USER JUST CREATED ACCOUNT

  // field1: payload-object to store our data here only id
  // field2: our secret using this only create signature
  // field3: option- here iam giving expiring time after that  the user will be logged out
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  // newUser.active = undefined;
  // await newUser.save({ validateBeforeSave: false });

  createSendToken(newUser, 201, res);
});

// IMPLEMENTING LOGGING IN THE USER

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; //it is similar to const email = req.body.email and const password = req.body.password
  //  1.Check if email and password is entered
  if (!email || !password) {
    return next(new AppError('Please Provide email and password', 400)); // 400- bad request
    // return - after calling next we need to make sure that this login ends here it should not go our third step
  }

  // 2.Check if user exists & pwd is correct
  // const user = User.findOne({ email }); //similar to const user = User.findOne({ email:email })

  // for security we should not leak pwd to user when they request all users details
  // so mention select: false in schema
  // after doing that now our output of user will not contain password

  // but we need to password
  // so we need to explicitly select passwd
  // + --> it will also select field that we mentioned select : false

  const user = await User.findOne({ email }).select('+password');
  // console.log(user);
  // now we can compare but how?
  // in our document - $2a$12$npJaW7O1ACwV2P.M7upis.XbRSqtNvhqxA9Rwe8siECGL1GYEapw
  // user entered pasws - pass1234
  // we need to use bcrypt to compare them
  // to comapre this let us create function in userModel

  // function we created in instance method and it is available on all docs and here user is document becoz it is result of querying user model
  // const correct = await user.correctPassword(password, user.password);

  // if (!user || !correct) {
  //   return next(new AppError('Incorrect password or email', 401)); //401 - unauthorized
  // }

  // the problem is if user itself dosn't exist then user.password willnot exist so to fix this

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect password or email', 401)); //401 - unauthorized
  }

  // 3.If evrything ok send token to client

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  await createSendToken(user, 200, res);
});

// to logout

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// to protect the routes

exports.protect = catchAsync(async (req, res, next) => {
  // console.log("reached");

  // 1.Getting token and check if it is there

  // common practice is to send http header with request authorization: bearer ${key}
  // access header by req.headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // this is because we will install cookie-parser so we can use cookie of user
    token = req.cookies.jwt;
  }
  // console.log(token);
  console.log('user token is', token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    ); //401 - unauthorized
  }

  // 2.VERIFICATION PROCESS
  // third arg reuires callback func but we want to return a promise so promisify it
  // it will return a decoded message
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // It will return two errors
  // 1.token invalid error
  // 2.token expired error
  // we handled them in error controller

  // 3 CHECK IF USER STILL EXISTS

  // if user deleted account after we issued token and someone trying to acces that token then we should not allow them

  const currentUser = await User.findById(decoded.id);
  console.log('😎😎😎', currentUser);
  if (!currentUser) {
    return next(
      new AppError('The token belonging to this user no longer exists', 401)
    ); //401 - unauthorized
  }

  // 4.CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED

  // if user has changed the pwd then we will not let them to acces
  // let us create an instance method
  const date = new Date(decoded.iat);
  console.log('ljqkbwejfk wv', decoded.iat, ' ', date);
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password Please log in again!', 401)
    ); //401 - unauthorized
  }
  console.log('iam here now');
  req.user = currentUser;
  res.locals.user = currentUser;
  console.log(req.user);
  next();
});

// only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // console.log("reached");

  // 1.Getting token and check if it is there

  // common practice is to send http header with request authorization: bearer ${key}
  // access header by req.headers

  if (req.cookies.jwt) {
    try {
      // this is because we will install cookie-parser so we can use cookie of user
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(token);

      // 2.VERIFICATION PROCESS
      // third arg reuires callback func but we want to return a promise so promisify it
      // it will return a decoded message
      // console.log(decoded);
      // It will return two errors
      // 1.token invalid error
      // 2.token expired error
      // we handled them in error controller

      // 3 CHECK IF USER STILL EXISTS

      // if user deleted account after we issued token and someone trying to acces that token then we should not allow them

      const currentUser = await User.findById(decoded.id);
      // console.log(currentUser);
      if (!currentUser) {
        return next(); //401 - unauthorized
      }

      // 4.CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED

      // if user has changed the pwd then we will not let them to acces
      // let us create an instance method
      if (await currentUser.changedPasswordAfter(decoded.iat)) {
        return next(); //401 - unauthorized
      }

      // There is a logged in user
      // every pug template have access to this
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  // console.log(req.user);
  next();
};

// AUTHORIZATION

// we cannnot pass arguments to middleware
// but here we want to pass the roles
// so we are creating a wrapper func and that will return middleware
exports.restrictTo =
  (...roles) =>
  // roles - it is array in deletetour case the roles allowed are = ['admin','lead-guide']
  (req, res, next) => {
    // roles will be available to this middleware becoz of closure
    // req.user we are assigned in protect middleware it will have detail of user logged in becoz we are running first protect middleware then only authorization middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403) //403 - forbidden
      );
    }
    next();
  };

// RESET PASSWORD

// First user sends a post req yto forgot pwd route only with email address.
// It will create reset token sent to email address that was provided.
// User send that token from his email address with new pwd inorder to update pwd

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // steps

  // 1.Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2.Generate the random reset token
  // we will create instance method
  const resetToken = user.changedPasswordResetToken();
  // we have modified our schema in instannce method we need to save it to the database
  await user.save({ validateBeforeSave: false }); // it deactivate all validators like required

  // 3.SEND IT TO USER'S MAIL
  // this reset link will be sent to mail and user can click this to update his password
  // the user will get token and user nedd to send that token to back so we can verified with encrypted reset token in db
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  // const message = `Forgot Your Paaword? Submit a patch request with your new password and passwordConfirm to :${resetURL}.\n If you didn't forgot, please ignore this email!`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 minutes)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // we are using try catch becoz if there is an error we need to set back pwdresettoken and pwdresetexpire
    // so we cant do it in global error handler
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // steps

  // 1.GET USWE BASED ON THE TOKEN
  // we have sent the non encrypted token and now we have to compare it with encrypted one
  // We need to encrypt original token again so we can compare it with token in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //we are sending token in parameter

  // we only know token so we can find the user using token
  // const user = await User.findOne({ passwordResetToken: hashedToken });

  // The above will find user using token but we need to also check token expiry so we cann query that to

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // STEP 2 : IF TOKEN HAS NOT EXPIRED AND THERE IS USER SET THE NEW PASSWORD

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400)); //400 - bad request
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Everything related to password we will use save because then only all validators will be runned again
  await user.save(); //no need to turn od the validators becoz we need to check pwd with cnfrm pwd

  // STEP 3: UPDATE changedPasswordAt property for the user
  // we can do this using middleware

  // STEP 4: LOG THE USER IN SEND JWT

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // STEP 1: GET USER FROM COLLECTION
  // const { user } = req;
  // const user1 = await User.findOne({ email: user.email }).select('+password');
  const user = await User.findById(req.user.id).select('+password');

  // STEP 2: CHECK IF PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401)); ///401-unauthorized
  }

  // STEP 3: IF SO UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // STEP 4: LOG USER IN, SEND JWT
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});
