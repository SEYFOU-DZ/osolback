const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (uri && uri !== 'offline') {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log(`[MongoDB Connected]: ${conn.connection.host}`);
      isMongoConnected = true;
      return;
    } catch (error) {
      console.warn(`[MongoDB Warning]: تعذر الاتصال بـ MongoDB (${error.message}). سيتم تفعيل التخزين الدائم JSON DB.`);
      isMongoConnected = false;
    }
  } else {
    console.log(`[Database Notice]: نمط قاعدة البيانات المحلي JSON-Store مفعّل بنجاح.`);
  }
};

const getLocalData = (file) => {
  const filePath = path.join(DATA_DIR, `${file}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
};

const saveLocalData = (file, data) => {
  const filePath = path.join(DATA_DIR, `${file}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = {
  connectDB,
  isMongo: () => isMongoConnected,
  getLocalData,
  saveLocalData
};
