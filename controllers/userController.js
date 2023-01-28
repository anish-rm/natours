const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ---------------------TO CONFIGURE-------
// we are going to create multer storage and multer filter and then we will use them to upload
// const multerStorage = multer.diskStorage({
//   //we cannot simply set path like public/img/users. It is call back function. It has access to current req and currently uploaded file and  a call back function
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); //first arg is for error
//   }, // it is like a next in express. We can also pass errors in here
//   // to set a filename
//   filename: (req, file, cb) => {
//     // we need to give some unique name --> user-userid-timestamp.jpg . There will no two images now.
//     // if we used only userid then multiple uploads by same user will be override
//     const ext = file.mimetype.split('/')[1]; //we can find this by consoling req.file in updateme
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

// if we want to do image processing then we should not save file like above
// we need to save it to memory

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

exports.uploadUserPhoto = upload.single('photo'); //photo --> name of the field

// ----------------------RESIZING IMAGE-----------------
// to resize install sharp npm i sharp
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  // why like this becoz first it is set by multer upload now we have deleted that so we need to set it like this then only our middleware can use it
  // eg we are accessing req.file.name in update user middleware but as we deleted that multer we need to set it like this
  // above we will set the extension based on user uplaoding now as we format all to jpg  we can that as extension

  // it is asynchronous function
  // it returns a promise they take some timme
  // they should not block event loop
  await sharp(req.file.buffer) //we can use like this becoz we are saving image bufferas memory in multer storage
    .resize(500, 500) // to crop it as square
    .toFormat('jpeg') // to convert it to jpeg
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); //to save it into our file storage
  next();
});

const filterObj = (obj, ...allowedFields) => {
  //...allowedFields create an array contining the arg we passed in
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

// we need a endpoint /me where user can know details about him

exports.getMe = (req, res, next) => {
  // const user = await User.findById(req.user.id);
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     data: user,
  //   },
  // });
  // but the problem above is it is exacty same as our getFactory handler except that
  // we get id from protect middleware here
  // and in getFactory Handlere we get it from params
  // so here we can just fake it by req.params.id = req.user.id
  // so now we just added to our params user id
  // but the user dont want to give any id he just need to be logged in
  req.params.id = req.user.id;
  next();
  // now in route after this middleware add getUser middleware
};

// It is for authenticated user to update their name and email
// we will also implement update user but it is for admin to update that
// we will always one place to update password and one place for updating data
exports.updateMe = catchAsync(async (req, res, next) => {
  // to view photo upload using multer
  console.log(req.file);
  console.log(req.body);

  // STEP 1: CREATE ERROR IF USER POSTS PASSWORD DATA(NOT ALLOW HIM TO UPDATE HERE)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // STEP 2: UPDATE USER DOCUMENT

  // const user = await User.findById(req.user.id);
  // user.name = 'Anish';
  // await user.save({ validateBeforeSave: false });

  // sice we are updating insensitive data we can do it findbyd and update

  // we could have body but if user set role:"asmin" then he can update anything
  // so we neefd to make sure that only name and email should be updated

  const filteredBody = filterObj(req.body, 'name', 'email');
  // to update the photo if user updatee the photo
  // if user updates then we will have access to this req.file
  if (req.file) filteredBody.photo = req.file.filename;
  // when user creating a ccount if they havent uploaded any photo we needd to set default
  console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//DELETING USER
// When user delete his account we do not delete it from database
// we just set it as inactive
// So user might some point may reactivate the account

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  //we dont want this user to appear in any req so use query middleware to selecte account with active true
  res.status(204).json({
    //204-deleted
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    //500-internal server error because currently we have not implemented this route
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User); //no populate options becoz we are not going to populate it

// It is only for administrators
// Only to update data not the password

// DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     //500-internal server error because currently we have not implemented this route
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

// all these delete handller look same
// we are duplicating code in all controllers
// so instead of doing this we can create factory function that will be genearlized we just need to send model and it will delete
// it is a function that returns another function

exports.deleteUser = factory.deleteOne(User);
