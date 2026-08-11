import { useState } from 'react';
import localDB from '../db/localDB';
import { queueSync, flushSyncQueue } from '../db/syncEngine';
import './IncidentForm.css';

const TYPES = ['Medical', 'Trapped', 'Fire', 'Flood', 'Structural Damage', 'Missing Person', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

function IncidentForm({ onReported }) {
  const [form, setForm] = useState({ type: 'Medical', severity: 'Medium', description: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 5000 }
      );
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const location = await getLocation();
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Always write locally first — this is what makes it work offline
    const localId = await localDB.incidents.add({
      meshId: localStorage.getItem('meshalert_meshid') || 'unknown',
      type: form.type,
      severity: form.severity,
      description: form.description,
      location,
      clientId,
      status: 'Reported',
      synced: 0,
      createdAt: new Date().toISOString(),
    });

    await queueSync('incident', localId, 'create');

    // Try to sync immediately in case we're online; if not, it stays queued
    const result = await flushSyncQueue();

    setStatus(
      result.pushed > 0
        ? { type: 'success', message: 'Incident reported and synced.' }
        : { type: 'pending', message: 'Saved locally. Will sync when connection is available.' }
    );
    setForm({ type: 'Medical', severity: 'Medium', description: '' });
    setSubmitting(false);
    if (onReported) onReported();
  }

  return (
    <form className="incident-form" onSubmit={handleSubmit}>
      <h2 className="incident-form__title">Report an incident</h2>

      <label className="field">
        <span>Type</span>
        <select name="type" value={form.type} onChange={handleChange}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Severity</span>
        <select name="severity" value={form.severity} onChange={handleChange}>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          maxLength={1000}
          rows={4}
          placeholder="What's happening, and what help is needed?"
        />
      </label>

      <button className="submit-btn" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Report incident'}
      </button>

      {status && (
        <p className={`status status--${status.type === 'success' ? 'success' : 'pending'}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}

export default IncidentForm;