const User = require('../models/User');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { isMongo, getLocalData, saveLocalData } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'osool_super_secret_jwt_key_2026_finance_secure', {
    expiresIn: '30d'
  });
};

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'يرجى تقديم جميع الحقول المطلوبة' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMongo()) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password
      });

      const workspace = await Workspace.create({
        name: `مساحة ${name.trim()}`,
        kind: 'personal',
        ownerId: user._id,
        members: [
          {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: 'owner'
          }
        ]
      });

      return res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          prefs: user.prefs
        },
        token: generateToken(user._id.toString()),
        workspace: {
          id: workspace._id.toString(),
          name: workspace.name,
          kind: workspace.kind,
          members: workspace.members
        }
      });
    } else {
      // Local Database Store
      const users = getLocalData('users');
      const userExists = users.some((u) => u.email === cleanEmail);
      if (userExists) {
        return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

      const newUser = {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'owner',
        createdAt: new Date().toISOString(),
        prefs: { lang: 'ar', calendar: 'gregorian', hideAmounts: false }
      };
      users.push(newUser);
      saveLocalData('users', users);

      const workspaces = getLocalData('workspaces');
      const wsId = 'ws_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const newWs = {
        id: wsId,
        name: `مساحة ${name.trim()}`,
        kind: 'personal',
        ownerId: userId,
        members: [{ id: userId, name: name.trim(), email: cleanEmail, role: 'owner' }],
        createdAt: new Date().toISOString(),
        currency: 'ر.س',
        modules: { warehouse: true, invoices: true }
      };
      workspaces.push(newWs);
      saveLocalData('workspaces', workspaces);

      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          prefs: newUser.prefs
        },
        token: generateToken(newUser.id),
        workspace: newWs
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMongo()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'بيانات الاعتماد غير صحيحة' });
      }

      const workspaces = await Workspace.find({
        $or: [{ ownerId: user._id }, { 'members.userId': user._id }, { 'members.email': user.email }]
      });

      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          prefs: user.prefs
        },
        token: generateToken(user._id.toString()),
        workspaces
      });
    } else {
      // Local Database Store
      const users = getLocalData('users');
      const user = users.find((u) => u.email === cleanEmail);
      if (!user) {
        return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
      }

      const workspaces = getLocalData('workspaces');
      const userWs = workspaces.filter((w) => w.ownerId === user.id || w.members?.some((m) => m.email === cleanEmail));

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          prefs: user.prefs
        },
        token: generateToken(user.id),
        workspaces: userWs
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    الحصول على بيانات المستخدم الحالي
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    if (isMongo()) {
      const user = await User.findById(req.user.id).select('-password');
      const workspaces = await Workspace.find({
        $or: [{ ownerId: user._id }, { 'members.userId': user._id }, { 'members.email': user.email }]
      });

      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          prefs: user.prefs
        },
        workspaces
      });
    } else {
      const users = getLocalData('users');
      const user = users.find((u) => u.id === req.user.id);
      if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

      const workspaces = getLocalData('workspaces');
      const userWs = workspaces.filter((w) => w.ownerId === user.id || w.members?.some((m) => m.email === user.email));

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          prefs: user.prefs
        },
        workspaces: userWs
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
