const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// problem is this route dont get access to the tourId that we specify in that url
// because each router only have access to the aparameters of their specific routes
// to make them access tourId use mergeParams
router.route('/').get(reviewController.getAllReview).post(
  authController.restrictTo('user'), //we only want users to post review not admins
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  );

module.exports = router;
