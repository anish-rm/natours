class AppError extends Error {
  // we are inheriting from built in error so only extends Error
  constructor(message, statusCode) {
    // we wil be passing two parameter to this class
    super(message);
    // To craete error we done new Error('here message')
    // since we are inheriting from Error here super(message) is similar to new Error(message)
    // we are calling parent class here
    this.statusCode = statusCode;
    // we know two types of error 4 starting error / 5 starting error so
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    this.isOperational = true;
    // It is done so we can then test this property for and only send error msg for operational eror.
    // Because there may be somee other error created using this class

    // We need to capture stackTrace
    // stackTrace - It shows what is the error and where the error happened
    // We want to preserve it and at same time not add class to stackTrace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
