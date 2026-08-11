const express = require('express');
const Incident = require('../models/Incident');
const Resource = require('../models/Resource');
const Peer = require('../models/Peer');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/command/overview — full system snapshot for Command Center
router.get('/overview', requireAuth, requireRole('Command Center'), async (req, res) => {
  try {
    const [incidents, resources, peers] = await Promise.all([
      Incident.find().sort({ createdAt: -1 }),
      Resource.find().sort({ createdAt: -1 }),
      Peer.find({ status: { $ne: 'offline' } }),
    ]);

    const incidentsByStatus = incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {});

    const incidentsBySeverity = incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {});

    const resourcesByStatus = resources.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalIncidents: incidents.length,
        totalResources: resources.length,
        activePeers: peers.length,
        incidentsByStatus,
        incidentsBySeverity,
        resourcesByStatus,
      },
      incidents,
      resources,
      peers,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load command overview', detail: err.message });
  }
});

module.exports = router;