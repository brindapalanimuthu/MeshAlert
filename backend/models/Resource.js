const mongoose = require('mongoose');

const RESOURCE_TYPES = ['Food', 'Water', 'Shelter', 'Medical Aid', 'Transport', 'Clothing', 'Other'];
const STATUSES = ['Available', 'Claimed', 'Depleted'];

const resourceSchema = new mongoose.Schema(
  {
    providerMeshId: { type: String, required: true }, // meshId of the volunteer/team offering this
    type: { type: String, enum: RESOURCE_TYPES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity: { type: String, trim: true }, // free-text ("20 meals", "3 beds") — disaster conditions rarely give exact counts
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: { type: String, enum: STATUSES, default: 'Available' },
    claimedBy: { type: String }, // meshId of whoever claimed it, if any
    clientId: { type: String, required: true, unique: true }, // dedup key for offline-created resources
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.STATUSES = STATUSES;