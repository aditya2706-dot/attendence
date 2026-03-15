const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  // Face descriptors are stored as an array of floating point numbers (128d)
  // We store multiple descriptors (5-10) per client
  faceDescriptors: {
    type: [[Number]],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
