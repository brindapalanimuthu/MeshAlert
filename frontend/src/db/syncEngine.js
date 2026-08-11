import localDB from './localDB';

const API_BASE = 'http://localhost:5001/api';

function getToken() {
  return localStorage.getItem('meshalert_token');
}

// Queue a local change to be pushed later (outbox pattern).
// entityType: 'incident' | 'resource'. operation: 'create' | 'update'.
export async function queueSync(entityType, entityId, operation) {
  await localDB.syncQueue.add({
    entityType,
    entityId,
    operation,
    createdAt: new Date().toISOString(),
  });
}

// Attempt to push everything in the outbox to the server.
// Called on network reconnect, on an interval, or manually.
export async function flushSyncQueue() {
  const token = getToken();
  if (!token) return { pushed: 0, failed: 0 };

  const queued = await localDB.syncQueue.toArray();
  let pushed = 0;
  let failed = 0;

  for (const item of queued) {
    try {
      const table = item.entityType === 'incident' ? localDB.incidents : localDB.resources;
      const record = await table.get(item.entityId);
      if (!record) {
        // Record was deleted locally before it ever synced — just drop the queue entry
        await localDB.syncQueue.delete(item.id);
        continue;
      }

      const endpoint = item.entityType === 'incident' ? 'incidents' : 'resources';
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(record),
      });

      if (res.ok) {
        await table.update(item.entityId, { synced: 1 });
        await localDB.syncQueue.delete(item.id);
        pushed++;
      } else {
        failed++;
      }
    } catch (err) {
      // Network still down, or server unreachable — leave in queue, try again later
      failed++;
    }
  }

  return { pushed, failed };
}

// Call once when the app starts, to auto-flush whenever connectivity returns.
export function setupAutoSync() {
  window.addEventListener('online', () => {
    flushSyncQueue();
  });
}