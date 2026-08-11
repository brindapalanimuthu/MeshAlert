const express = require('express');
const Peer = require('../models/Peer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/mesh/register — a device announces itself when it comes online
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { peerJsId, lat, lng, hopCount } = req.body;
    if (!peerJsId) {
      return res.status(400).json({ error: 'peerJsId is required' });
    }
    const peer = await Peer.findOneAndUpdate(
      { meshId: req.user.meshId },
      {
        meshId: req.user.meshId,
        peerJsId,
        role: req.user.role,
        lastHeartbeat: new Date(),
        lastLocation: lat != null && lng != null ? { lat, lng } : undefined,
        hopCount: hopCount || 0,
        status: 'online',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ peer });
  } catch (err) {
    res.status(500).json({ error: 'Peer registration failed', detail: err.message });
  }
});

// POST /api/mesh/heartbeat — periodic keep-alive from a connected device
router.post('/heartbeat', requireAuth, async (req, res) => {
  try {
    const { lat, lng, hopCount, status } = req.body;
    const update = { lastHeartbeat: new Date() };
    if (lat != null && lng != null) update.lastLocation = { lat, lng };
    if (hopCount != null) update.hopCount = hopCount;
    if (status) update.status = status;

    const peer = await Peer.findOneAndUpdate({ meshId: req.user.meshId }, update, { new: true });
    if (!peer) {
      return res.status(404).json({ error: 'Peer not registered yet — call /register first' });
    }
    res.json({ peer });
  } catch (err) {
    res.status(500).json({ error: 'Heartbeat update failed', detail: err.message });
  }
});

// GET /api/mesh/peers — list currently known peers (for building the mesh topology client-side)
router.get('/peers', requireAuth, async (req, res) => {
  try {
    await Peer.markStalePeersOffline();
    const peers = await Peer.find({ status: { $ne: 'offline' } }).select('-__v');
    res.json({ peers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list peers', detail: err.message });
  }
});

// DELETE /api/mesh/peers/me — explicit disconnect
router.delete('/peers/me', requireAuth, async (req, res) => {
  try {
    await Peer.findOneAndUpdate({ meshId: req.user.meshId }, { status: 'offline' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect peer', detail: err.message });
  }
});

module.exports = router;