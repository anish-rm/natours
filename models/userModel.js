const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    // It will be used to user to login
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //it will transform to lowercase
    // To validate the email address
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  //it is optioal so no required
  photo: {
    type: String,
    default: 'default.jpg', // if user creates account without photo
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    requires: [true, 'Please provide your password'],
    minlength: 8,
    select: false,
  },
  // when we create acount we always need to type confirm password
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // to check whether password == confirm password
    validate: {
      // This works only on save and create so whenever update the password we nedd to save it
      validator: function (el) {
        return el === this.password; //we return either true or false in validation
      },
      message: 'Passwords are not same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// We need to never store plain passwors in db. We have to encrypt/hash tem before storing them in db
//
userSchema.pre('save', async function (next) {
  // ONLY RUNN THIS FUNC WHEN PASSWORD IS MODIFIED
  //we only want to encrypt when password is created or updated
  if (!this.isModified('password')) return next();

  //encrypting / hash
  //we use very popular algo called bcrypt - first salt and hash
  //salt - add random string to pwd so two equal pass do not generate same
  this.password = await bcrypt.hash(this.password, 12);
  // 12 - cost parameter
  // there is both sync and async. We are using async because we don't want to block

  // DELETE PASSWORDCONFIRM FIELD
  // Now we have to remove passwordConfirm field from storing in database
  this.passwordConfirm = undefined;
  // required - means only input is required. It doesn't mean we need to store it in a database
  next();
});

userSchema.pre('save', function (next) {
  // we only need to have changedPassword at field only when user updated
  // we should not want this when created newso use this.isNew
  if (!this.isModified('password') || this.isNew) return next();

  // some problem may occur that saving to database may be bit slow but before that token may be issued
  // to fix this just store 1 sec  before
  this.passwordChangedAt = Date.now() - 60000;
  next();
});

// query middleware - it will be executed before any find starting query
userSchema.pre(/^find/, function (next) {
  // this --> points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// instance method - method that is available on all documents of certain collection

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  // in instanvce method this point to current document
  // if user not changed they will not have passwordChangedAt field
  if (this.passwordChangedAt) {
    // to convert the date to milliseconds
    console.log(this.passwordChangedAt);
    const changed = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changed, JWTTimestamp);
    // console.log(JWTTimestamp < changed);
    return JWTTimestamp < changed; // we will return false if pasword changfed before jwt issued or true
  }

  return false; //defaulty we will return false means the user has not changed pwd after token was issued
};

userSchema.methods.changedPasswordResetToken = function () {
  // we crete using built-in crypto module
  const resetToken = crypto.randomBytes(32).toString('hex');
  // we should not store this token as it in db
  // we can encrypt and store it
  // we no need to use bcrypt like hash because this have low attack vector
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken); //{} - it wil print name with value
  // we want to passwordrest to expire after 10min
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
