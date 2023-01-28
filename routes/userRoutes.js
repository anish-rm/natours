const express = require('express');
const userController = require('../controllers/userController');
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

const router = express.Router();
const authController = require('../controllers/authController');

// // multer is used to handle multi-part form data
// // now it will save img to public/img/users
// const upload = multer({ dest: 'public/img/users' });

// Special case that doesn't fit 100% REST Architecture
// here post not route and post becoz we are only going to create user through signup
// THESE ROUTES ARE OPEN FOR ALL
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// we want protect for all routes below
// so intead of putting in all middleware initailly put in one middleware
// middleware executes sequence after this only others are exceuteed
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/Me', userController.getMe, userController.getUser);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto, // photo - field in the form that we will update . This middleware put some inf in req object
  userController.resizeUserPhoto,
  authController.protect,
  userController.updateMe
);

// we will not actually delete but the user is not aacccesible anywhere so it is ok to use delete http method
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
