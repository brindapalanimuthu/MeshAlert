const express = require('express');
const Resource = require('../models/Resource');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/resources — offer a resource (volunteers, rescue teams, command center)
router.post('/', requireAuth, async (req, res) => {
  try {
    const allowedRoles = ['Volunteer', 'Rescue Team', 'Command Center'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only volunteers and responders can offer resources' });
    }

    const { type, description, quantity, location, clientId } = req.body;
    if (!type || !description || !clientId) {
      return res.status(400).json({ error: 'type, description, and clientId are required' });
    }

    const existing = await Resource.findOne({ clientId });
    if (existing) {
      return res.status(200).json({ resource: existing });
    }

    const resource = new Resource({
      providerMeshId: req.user.meshId,
      type,
      description,
      quantity,
      location,
      clientId,
    });
    await resource.save();
    res.status(201).json({ resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource', detail: err.message });
  }
});

// GET /api/resources — list resources (optionally filter by status or type)
router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list resources', detail: err.message });
  }
});

// PATCH /api/resources/:id/claim — someone claims an available resource
router.patch('/:id/claim', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.status !== 'Available') {
      return res.status(409).json({ error: `Resource is already ${resource.status.toLowerCase()}` });
    }
    resource.status = 'Claimed';
    resource.claimedBy = req.user.meshId;
    await resource.save();
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim resource', detail: err.message });
  }
});

// PATCH /api/resources/:id — update status directly (e.g. mark Depleted)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const resource = await Resource.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resource', detail: err.message });
  }
});

module.exports = router;