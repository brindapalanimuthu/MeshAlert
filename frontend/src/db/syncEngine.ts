import localDB from './localDB';

const API_BASE = 'http://localhost:5001/api';

function getToken(): string | null {
  return localStorage.getItem('meshalert_token');
}

export async function queueSync(
  entityType: 'incident' | 'resource',
  entityId: number,
  operation: 'create' | 'update'
): Promise<void> {
  await localDB.syncQueue.add({
    entityType,
    entityId,
    operation,
    createdAt: new Date().toISOString(),
  });
}

export async function flushSyncQueue(): Promise<{ pushed: number; failed: number }> {
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
        await localDB.syncQueue.delete(item.id!);
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
        await localDB.syncQueue.delete(item.id!);
        pushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { pushed, failed };
}

export function setupAutoSync(): void {
  window.addEventListener('online', () => {
    flushSyncQueue();
  });
}
