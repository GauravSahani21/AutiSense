import express from 'express';
import { register, login, getMe, logout, updateDetails } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['parent', 'doctor', 'admin'])
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  validate,
  login
);

router.get('/me', protect, getMe);
router.put('/updateDetails', protect, updateDetails);
router.post('/logout', logout);

export default router;
