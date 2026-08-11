import { useState } from 'react';
import localDB from '../db/localDB';
import { queueSync, flushSyncQueue } from '../db/syncEngine';
import './ResourceForm.css';

const TYPES = ['Food', 'Water', 'Shelter', 'Medical Aid', 'Transport', 'Clothing', 'Other'];

function ResourceForm({ onOffered }) {
  const [form, setForm] = useState({ type: 'Water', description: '', quantity: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const clientId = `local-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const localId = await localDB.resources.add({
      meshId: localStorage.getItem('meshalert_meshid') || 'unknown',
      type: form.type,
      description: form.description,
      quantity: form.quantity,
      clientId,
      status: 'Available',
      synced: 0,
      createdAt: new Date().toISOString(),
    });

    await queueSync('resource', localId, 'create');
    const result = await flushSyncQueue();

    setStatus(
      result.pushed > 0
        ? { type: 'success', message: 'Resource offered and synced.' }
        : { type: 'pending', message: 'Saved locally. Will sync when connection is available.' }
    );
    setForm({ type: 'Water', description: '', quantity: '' });
    setSubmitting(false);
    if (onOffered) onOffered();
  }

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      <h2 className="resource-form__title">Offer a resource</h2>

      <label className="field">
        <span>Type</span>
        <select name="type" value={form.type} onChange={handleChange}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Quantity</span>
        <input
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          placeholder="e.g. 20 meals, 3 beds"
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          maxLength={500}
          rows={3}
          placeholder="What's available and where to find it?"
        />
      </label>

      <button className="submit-btn" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Offer resource'}
      </button>

      {status && (
        <p className={`status status--${status.type === 'success' ? 'success' : 'pending'}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}

export default ResourceForm;