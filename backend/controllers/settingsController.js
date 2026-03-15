const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public (Needed by LiveAttendance)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({}); // Create default if none exists
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    const { officeLocation, allowedRadius, aiThreshold } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (officeLocation) settings.officeLocation = officeLocation;
    if (allowedRadius) settings.allowedRadius = allowedRadius;
    if (aiThreshold) settings.aiThreshold = aiThreshold;
    settings.updatedAt = Date.now();

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
