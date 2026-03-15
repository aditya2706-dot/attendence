const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: { type: String, required: true },
  employeeId: { type: String, required: true },
  department: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['Present', 'Not Recognized'], default: 'Present' },
  confidence: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
