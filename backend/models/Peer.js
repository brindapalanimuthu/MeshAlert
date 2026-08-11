const mongoose = require('mongoose');

const peerSchema = new mongoose.Schema(
  {
    meshId: { type: String, required: true, unique: true }, // matches User.meshId
    peerJsId: { type: String, required: true }, // PeerJS connection id (can rotate per session)
    role: { type: String, enum: ['Victim', 'Volunteer', 'Rescue Team', 'Command Center'], required: true },
    lastHeartbeat: { type: Date, default: Date.now },
    lastLocation: {
      lat: Number,
      lng: Number,
    },
    hopCount: { type: Number, default: 0 }, // hops from nearest internet-connected node, for relay prioritization
    status: { type: String, enum: ['online', 'offline', 'relaying'], default: 'online' },
  },
  { timestamps: true }
);

const STALE_MS = 45_000; // no heartbeat in this window = considered offline

peerSchema.statics.markStalePeersOffline = async function () {
  const cutoff = new Date(Date.now() - STALE_MS);
  await this.updateMany(
    { lastHeartbeat: { $lt: cutoff }, status: { $ne: 'offline' } },
    { $set: { status: 'offline' } }
  );
};

module.exports = mongoose.model('Peer', peerSchema);
module.exports.STALE_MS = STALE_MS;