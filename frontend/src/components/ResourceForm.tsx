import { useState } from 'react';
import { Package, Loader2, CheckCircle2, Clock } from 'lucide-react';
import type { StatusType } from '@/types';

const API_BASE = 'http://localhost:5001/api';

const TYPES = ['Food', 'Water', 'Shelter', 'Medical Aid', 'Transport', 'Clothing', 'Other'];

interface ResourceFormProps {
  onOffered?: () => void;
}

interface FormState {
  type: string;
  description: string;
  quantity: string;
}

export default function ResourceForm({ onOffered }: ResourceFormProps) {
  const [form, setForm] = useState<FormState>({
    type: 'Water',
    description: '',
    quantity: '',
  });

  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setStatus(null);

    try {
      const token = localStorage.getItem('meshalert_token');

      if (!token) {
        throw new Error('Please login first.');
      }

      const clientId = `resource-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const response = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          quantity: form.quantity,
          clientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to offer resource.');
      }

      setStatus({
        type: 'success',
        message: 'Resource offered successfully.',
      });

      setForm({
        type: 'Water',
        description: '',
        quantity: '',
      });

      if (onOffered) {
        onOffered();
      }
    } catch (error) {
      setStatus({
        type: 'pending',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to offer resource.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[460px] flex flex-col gap-[1.1rem] rounded-2xl border border-ink-200/70 bg-white/90 p-8 shadow-lg shadow-ink-900/5 glass-surface animate-card-rise dark:border-ink-700/50 dark:bg-ink-800/40 dark:shadow-black/30"
    >
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary-500 dark:text-primary-400" />

        <h2 className="text-[1.3rem] font-display font-semibold text-ink-900 dark:text-white">
          Offer a resource
        </h2>
      </div>

      <label className="flex flex-col gap-[0.4rem]">
        <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
          Type
        </span>

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white"
        >
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-[0.4rem]">
        <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
          Quantity
        </span>

        <input
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          placeholder="e.g. 20 meals, 3 beds"
          className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white dark:placeholder:text-ink-500"
        />
      </label>

      <label className="flex flex-col gap-[0.4rem]">
        <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
          Description
        </span>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          maxLength={500}
          rows={3}
          placeholder="What's available and where to find it?"
          className="resize-vertical rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white dark:placeholder:text-ink-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-[0.85rem] py-[0.85rem] text-[0.95rem] font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Offering…
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            Offer resource
          </>
        )}
      </button>

      {status && (
        <p
          className={`flex items-center gap-2 rounded-lg px-3 py-[0.6rem] text-[0.85rem] animate-status-in ${
            status.type === 'success'
              ? 'bg-success-500/12 text-success-600 dark:text-success-400'
              : 'bg-warning-500/12 text-warning-600 dark:text-warning-400'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 shrink-0" />
          )}

          {status.message}
        </p>
      )}
    </form>
  );
}