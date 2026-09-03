import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'autisense_token';

export const getTokenFromRequest = (req) => {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

export const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'autisense_super_secret_jwt_key_2024';
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is disabled. Contact an administrator.' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Role ${req.user.role} is not authorized to access this route`,
    });
  }
  next();
};
