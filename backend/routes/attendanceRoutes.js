const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceLogs } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/mark', markAttendance);
router.get('/logs', protect, getAttendanceLogs);

module.exports = router;
