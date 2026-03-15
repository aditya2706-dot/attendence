const express = require('express');
const router = express.Router();
const { getStats, getWeeklyStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/weekly-stats', protect, getWeeklyStats);

module.exports = router;
