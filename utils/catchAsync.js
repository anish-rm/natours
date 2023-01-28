// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
  return (req, res, next) => {
    console.log(' found me too ');
    fn(req, res, next).catch((err) => next(err));
  };
};
