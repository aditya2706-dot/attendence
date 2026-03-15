const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initReportScheduler } = require('./services/reportService');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Init Scheduled Tasks
initReportScheduler();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Higher limit for base64 images if needed
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes (to be implemented)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
