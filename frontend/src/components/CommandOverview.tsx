import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Users, Package, Activity, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

interface CommandData {
  summary: {
    totalIncidents: number;
    totalResources: number;
    activePeers: number;
    incidentsBySeverity: Record<string, number>;
  };
  incidents: Array<{
    _id: string;
    type: string;
    severity: string;
    description: string;
    status: string;
  }>;
  resources: Array<{
    _id: string;
    type: string;
    quantity: string;
    description: string;
    status: string;
  }>;
  peers: unknown[];
}

const STAT_CARDS = [
  { key: 'totalIncidents', label: 'Total incidents', icon: AlertTriangle, color: 'text-danger-500' },
  { key: 'totalResources', label: 'Total resources', icon: Package, color: 'text-success-500' },
  { key: 'activePeers', label: 'Active peers', icon: Users, color: 'text-primary-500' },
] as const;

export default function CommandOverview() {
  const [data, setData] = useState<CommandData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('meshalert_token');
      const res = await fetch(`${API_BASE}/command/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load overview');
      setData(json as CommandData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-3 font-mono text-[0.9rem] text-ink-500 dark:text-ink-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading system overview…
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 text-danger-500 dark:text-danger-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-mono text-[0.9rem]">{error}</span>
      </div>
    );

  if (!data) return null;

  const { summary, incidents, resources } = data;

  return (
    <div className="flex flex-col gap-7 animate-card-rise">
      {/* Stat cards */}
      <div className="flex flex-wrap gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl border border-ink-200/70 bg-white/80 p-5 shadow-sm glass-surface dark:border-ink-700/50 dark:bg-ink-800/40"
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="font-display text-[2rem] font-bold text-ink-900 dark:text-white">
              {summary[key as keyof typeof summary] as number}
            </span>
            <span className="text-[0.8rem] text-ink-500 dark:text-ink-300">{label}</span>
          </div>
        ))}
      </div>

      {/* Severity breakdown */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-[1rem] font-semibold text-ink-900 dark:text-white">
          <Activity className="h-4 w-4 text-primary-500" />
          Incidents by severity
        </h3>
        <div className="flex flex-wrap gap-[0.6rem]">
          {Object.entries(summary.incidentsBySeverity).map(([sev, count]) => (
            <span
              key={sev}
              className={`rounded-full px-3 py-[0.35rem] text-[0.8rem] font-semibold severity-chip--${sev.toLowerCase()}`}
            >
              {sev}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[1rem] font-semibold text-ink-900 dark:text-white">
            All incidents ({incidents.length})
          </h3>
          {incidents.map((inc) => (
            <div
              key={inc._id}
              className="mb-3 flex items-start justify-between gap-4 rounded-xl border border-ink-200/60 bg-white/60 px-[1.1rem] py-[0.9rem] dark:border-ink-700/40 dark:bg-ink-800/30"
            >
              <div>
                <strong className="text-[0.9rem] text-ink-900 dark:text-white">{inc.type}</strong> ·{' '}
                <span className="text-[0.85rem] text-ink-500 dark:text-ink-300">{inc.severity}</span>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-600 dark:text-ink-200">
                  {inc.description}
                </p>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-[0.6rem] py-[0.25rem] text-[0.7rem] font-semibold status-chip--${inc.status
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                {inc.status}
              </span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-[1rem] font-semibold text-ink-900 dark:text-white">
            All resources ({resources.length})
          </h3>
          {resources.map((res) => (
            <div
              key={res._id}
              className="mb-3 flex items-start justify-between gap-4 rounded-xl border border-ink-200/60 bg-white/60 px-[1.1rem] py-[0.9rem] dark:border-ink-700/40 dark:bg-ink-800/30"
            >
              <div>
                <strong className="text-[0.9rem] text-ink-900 dark:text-white">{res.type}</strong> ·{' '}
                <span className="text-[0.85rem] text-ink-500 dark:text-ink-300">{res.quantity}</span>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-600 dark:text-ink-200">
                  {res.description}
                </p>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-[0.6rem] py-[0.25rem] text-[0.7rem] font-semibold status-chip--${res.status.toLowerCase()}`}
              >
                {res.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={load}
        className="flex w-fit items-center gap-2 rounded-xl border border-ink-200/70 px-6 py-[0.7rem] text-[0.85rem] font-medium text-ink-700 transition-colors hover:border-primary-500 hover:bg-primary-500/8 dark:border-ink-600/50 dark:text-ink-200 dark:hover:bg-primary-500/10"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh overview
      </button>
    </div>
  );
}
