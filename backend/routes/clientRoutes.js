const express = require('express');
const router = express.Router();
const { registerClient, getClients, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, registerClient)
  .get(protect, getClients);

router.route('/:id')
  .delete(protect, deleteClient);

module.exports = router;
