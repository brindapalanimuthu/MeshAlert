import Dexie from 'dexie';

// Local offline-first database. Each device keeps its own copy of
// incidents/resources here, then syncs to the server (or peers) when
// connectivity is available.
export const localDB = new Dexie('MeshAlertDB');

localDB.version(1).stores({
  // incidents: local-first incident reports. synced: 0 = not yet pushed, 1 = confirmed synced
  incidents: '++id, meshId, status, synced, createdAt',
  // resources: supplies/help offered by a peer
  resources: '++id, meshId, type, synced, createdAt',
  // syncQueue: outbox pattern — queued operations waiting for connectivity
  syncQueue: '++id, entityType, entityId, operation, createdAt',
});

export default localDB;