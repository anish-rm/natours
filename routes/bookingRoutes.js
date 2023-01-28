const express = require('express');
const bookingController = require('../controllers/bookingContoller');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckOutSession
);

module.exports = router;
