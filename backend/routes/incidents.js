const express = require('express');
const Incident = require('../models/Incident');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/incidents — report a new incident
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, severity, description, location, clientId } = req.body;
    if (!type || !description || !location || !clientId) {
      return res.status(400).json({ error: 'type, description, location, and clientId are required' });
    }

    // If this clientId was already synced before (e.g. retried after a flaky connection),
    // return the existing record instead of erroring
    const existing = await Incident.findOne({ clientId });
    if (existing) {
      return res.status(200).json({ incident: existing });
    }

    const incident = new Incident({
      reporterMeshId: req.user.meshId,
      type,
      severity,
      description,
      location,
      clientId,
    });
    await incident.save();
    res.status(201).json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report incident', detail: err.message });
  }
});

// GET /api/incidents — list incidents (optionally filter by status)
router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const incidents = await Incident.find(filter).sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list incidents', detail: err.message });
  }
});

// PATCH /api/incidents/:id — update status or assignment (rescue team/command center use)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const allowedRoles = ['Rescue Team', 'Command Center', 'Volunteer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only responders can update incident status' });
    }
    const { status, assignedTo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;

    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident', detail: err.message });
  }
});

module.exports = router;