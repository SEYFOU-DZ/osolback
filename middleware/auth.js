const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongo, getLocalData } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osool_super_secret_jwt_key_2026_finance_secure');

      if (isMongo()) {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ message: 'المستخدم غير موجود' });
        }
      } else {
        const users = getLocalData('users');
        const user = users.find((u) => u.id === decoded.id);
        if (!user) {
          return res.status(401).json({ message: 'المستخدم غير موجود' });
        }
        const { password, ...safeUser } = user;
        req.user = safeUser;
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح، لا يوجد رمز دخول' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'غير مصرح لك بتنفيذ هذه العملية' });
    }
    next();
  };
};

module.exports = { protect, authorize };
