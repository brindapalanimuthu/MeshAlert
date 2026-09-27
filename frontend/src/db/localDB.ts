import Dexie from 'dexie';

export interface Incident {
  id?: number;
  meshId: string;
  type: string;
  severity: string;
  description: string;
  location: { lat: number | null; lng: number | null };
  clientId: string;
  status: string;
  synced: number;
  createdAt: string;
}

export interface Resource {
  id?: number;
  meshId: string;
  type: string;
  description: string;
  quantity: string;
  clientId: string;
  status: string;
  synced: number;
  createdAt: string;
  location?: { lat: number | null; lng: number | null };
}

interface SyncQueueItem {
  id?: number;
  entityType: 'incident' | 'resource';
  entityId: number;
  operation: 'create' | 'update';
  createdAt: string;
}

export const localDB = new Dexie('MeshAlertDB') as Dexie & {
  incidents: Dexie.Table<Incident, number>;
  resources: Dexie.Table<Resource, number>;
  syncQueue: Dexie.Table<SyncQueueItem, number>;
};

localDB.version(1).stores({
  incidents: '++id, meshId, status, synced, createdAt',
  resources: '++id, meshId, type, synced, createdAt',
  syncQueue: '++id, entityType, entityId, operation, createdAt',
});

export default localDB;
