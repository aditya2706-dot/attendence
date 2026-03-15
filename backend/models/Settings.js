const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  officeLocation: {
    lat: { type: Number, required: true, default: 27.5962 },
    lng: { type: Number, required: true, default: 76.6167 }
  },
  allowedRadius: { type: Number, required: true, default: 100 }, // in meters
  aiThreshold: { type: Number, required: true, default: 0.6 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
