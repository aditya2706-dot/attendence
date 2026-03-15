const Attendance = require('../models/Attendance');
const Client = require('../models/Client');
const { sendNotification } = require('../services/notificationService');

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Public (Called by Live Camera Page)
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, confidence } = req.body;

    // Find client
    const client = await Client.findOne({ employeeId });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if attendance already recorded in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingAttendance = await Attendance.findOne({
      employeeId,
      timestamp: { $gte: oneHourAgo }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already recorded within the last hour' });
    }

    // Record attendance
    const attendance = await Attendance.create({
      client: client._id,
      name: client.name,
      employeeId: client.employeeId,
      department: client.department,
      confidence,
      status: 'Present'
    });

    // Real-time USP Alert
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    sendNotification(`${client.name} (${client.department}) has arrived at ${time}.`);

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance logs
// @route   GET /api/attendance/logs
// @access  Private
exports.getAttendanceLogs = async (req, res) => {
  try {
    const { date, name } = req.query;
    let query = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const logs = await Attendance.find(query).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
