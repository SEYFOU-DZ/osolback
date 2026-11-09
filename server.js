const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// تحميل متغيرات البيئة
dotenv.config();

// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// إعدادات Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// مسارات التحقق والأمان
app.use('/api/auth', require('./routes/auth'));

// مسارات النظام الأساسية (الأصول، الديون، المستودع، الفواتير)
app.use('/api', require('./routes/api'));

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'خادم منصة أصول OSOOL Backend API يعمل بنجاح',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[OSOOL API Server]: يعمل بنجاح على المنفذ http://localhost:${PORT}`);
});
