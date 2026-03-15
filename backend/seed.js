const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    await Admin.deleteMany();
    
    const admin = await Admin.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'admin123' // This will be hashed by the model's pre-save hook
    });

    console.log('Default Admin Created:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
