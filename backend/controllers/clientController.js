const Client = require('../models/Client');

// @desc    Register a new client with face embeddings
// @route   POST /api/clients
// @access  Private (Admin only)
exports.registerClient = async (req, res) => {
  try {
    const { name, employeeId, department, faceDescriptors } = req.body;

    const clientExists = await Client.findOne({ employeeId });

    if (clientExists) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    const client = await Client.create({
      name,
      employeeId,
      department,
      faceDescriptors,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (client) {
      await client.deleteOne();
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
