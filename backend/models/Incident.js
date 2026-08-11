const mongoose = require('mongoose');

const INCIDENT_TYPES = ['Medical', 'Trapped', 'Fire', 'Flood', 'Structural Damage', 'Missing Person', 'Other'];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Reported', 'Acknowledged', 'In Progress', 'Resolved'];

const incidentSchema = new mongoose.Schema(
  {
    reporterMeshId: { type: String, required: true }, // meshId of the person who reported it
    type: { type: String, enum: INCIDENT_TYPES, required: true },
    severity: { type: String, enum: SEVERITY_LEVELS, default: 'Medium' },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: { type: String, enum: STATUSES, default: 'Reported' },
    assignedTo: { type: String }, // meshId of rescue team/volunteer handling it, if any
    // clientId lets offline-created incidents avoid duplicate inserts when synced later
    clientId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
module.exports.INCIDENT_TYPES = INCIDENT_TYPES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;
module.exports.STATUSES = STATUSES;