import { useState, useEffect } from 'react';
import {
  Radio,
  AlertTriangle,
  Package,
  Map,
  Command,
  LogOut,
  CheckCircle2,
  Clock,
  Loader2,
  Info,
} from 'lucide-react';

import SignalPulse from '@/components/SignalPulse';
import IncidentForm from '@/components/IncidentForm';
import ResourceForm from '@/components/ResourceForm';
import LiveMap from '@/components/LiveMap';
import CommandOverview from '@/components/CommandOverview';
import ThemeToggle from '@/components/ThemeToggle';

import type { Incident, Resource } from '@/db/localDB';
import type { User, Tab, StatusType } from '@/types';

const API_BASE = 'http://localhost:5001/api';

const TAB_CONFIG: {
  key: Tab;
  label: string;
  icon: typeof AlertTriangle;
}[] = [
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { key: 'resources', label: 'Resources', icon: Package },
  { key: 'map', label: 'Live Map', icon: Map },
];

const SEVERITY_STYLES: Record<string, string> = {
  Low: 'bg-success-500/12 text-success-600 dark:text-success-400',
  Medium: 'bg-warning-500/12 text-warning-600 dark:text-warning-400',
  High: 'bg-accent-500/12 text-accent-600 dark:text-accent-400',
  Critical: 'bg-danger-500/14 text-danger-600 dark:text-danger-400',
};

function getToken(): string | null {
  return localStorage.getItem('meshalert_token');
}

async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

/* Backend API response types */

interface ApiIncident {
  _id: string;
  meshId?: string;
  type: string;
  severity: string;
  description: string;
  location?: {
    lat: number | null;
    lng: number | null;
  };
  status: string;
  assignedTo?: string;
  createdAt: string;
}

interface ApiResource {
  _id: string;
  meshId?: string;
  type: string;
  description: string;
  quantity?: string;
  location?: {
    lat: number | null;
    lng: number | null;
  };
  status: string;
  claimedBy?: string;
  createdAt: string;
}

function mapIncident(data: ApiIncident): Incident {
  return {
    id: data._id,
    type: data.type,
    severity: data.severity,
    description: data.description,
    location: data.location,
    createdAt: data.createdAt,
    synced: 1,
  } as unknown as Incident;
}

function mapResource(data: ApiResource): Resource {
  return {
    id: data._id,
    type: data.type,
    description: data.description,
    quantity: data.quantity,
    location: data.location,
    createdAt: data.createdAt,
    synced: 1,
  } as unknown as Resource;
}

function Dashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadIncidents() {
    try {
      setLoadingIncidents(true);
      setError(null);

      const res = await apiFetch('/incidents');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load incidents');
      }

      const mappedIncidents = (data.incidents || []).map(
        (incident: ApiIncident) => mapIncident(incident)
      );

      setIncidents(mappedIncidents);
    } catch (err) {
      console.error('Failed to load incidents:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load incidents'
      );
    } finally {
      setLoadingIncidents(false);
    }
  }

  async function loadResources() {
    try {
      setLoadingResources(true);
      setError(null);

      const res = await apiFetch('/resources');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load resources');
      }

      const mappedResources = (data.resources || []).map(
        (resource: ApiResource) => mapResource(resource)
      );

      setResources(mappedResources);
    } catch (err) {
      console.error('Failed to load resources:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load resources'
      );
    } finally {
      setLoadingResources(false);
    }
  }

  useEffect(() => {
    loadIncidents();
    loadResources();
  }, []);

  const canOfferResources = [
    'Volunteer',
    'Rescue Team',
    'Command Center',
  ].includes(user.role);

  const isCommandCenter = user.role === 'Command Center';

  const tabs = [...TAB_CONFIG];

  if (isCommandCenter) {
    tabs.push({
      key: 'command',
      label: 'Command',
      icon: Command,
    });
  }

  return (
    <div className="min-h-screen bg-ink-50 px-[clamp(1.5rem,5vw,4rem)] py-10 transition-colors dark:bg-ink-950">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 animate-hero-rise">
        <div className="flex items-center gap-5">
          <SignalPulse size={56} active />

          <div>
            <h1 className="font-display text-[1.6rem] font-bold text-ink-900 dark:text-white">
              MeshAlert
            </h1>

            <p className="mt-0.5 font-mono text-[0.8rem] text-ink-500 dark:text-ink-400">
              Signed in as {user.name} · {user.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-ink-200/70 bg-white/80 px-4 py-2 text-[0.85rem] font-medium text-ink-600 transition-colors hover:border-danger-400 hover:text-danger-500 dark:border-ink-700/50 dark:bg-ink-800/50 dark:text-ink-300 dark:hover:border-danger-400"
          >
            <LogOut className="h-4 w-4" />

            <span className="hidden sm:inline">
              Sign out
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex w-fit gap-1 rounded-xl border border-ink-200/70 bg-white/80 p-1 shadow-sm dark:border-ink-700/50 dark:bg-ink-800/50">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-[0.6rem] text-[0.9rem] font-medium transition-all ${
              tab === key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-xl border border-danger-300 bg-danger-50 px-4 py-3 text-sm text-danger-600 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400">
          {error}
        </div>
      )}

      {/* INCIDENTS */}
      {tab === 'incidents' && (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">

          <IncidentForm onReported={loadIncidents} />

          <div className="flex flex-col gap-4 animate-card-rise">

            <h2 className="text-[1.1rem] font-semibold text-ink-900 dark:text-white">
              Reported incidents
            </h2>

            {loadingIncidents && (
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading incidents...
              </div>
            )}

            {!loadingIncidents && incidents.length === 0 && (
              <p className="text-[0.9rem] text-ink-400 dark:text-ink-500">
                No incidents reported yet.
              </p>
            )}

            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-200/60 bg-white/70 px-5 py-4 transition-all hover:border-primary-400 hover:-translate-y-px dark:border-ink-700/40 dark:bg-ink-800/30"
              >
                <div className="flex items-center justify-between">

                  <span className="font-semibold text-ink-900 dark:text-white">
                    {inc.type}
                  </span>

                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
                      inc.synced
                        ? 'bg-success-500/12 text-success-600 dark:text-success-400'
                        : 'bg-warning-500/12 text-warning-600 dark:text-warning-400'
                    }`}
                  >
                    {inc.synced ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}

                    {inc.synced ? 'Synced' : 'Pending sync'}
                  </span>
                </div>

                <p className="text-[0.9rem] leading-relaxed text-ink-600 dark:text-ink-200">
                  {inc.description}
                </p>

                <div className="flex items-center gap-2">

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${
                      SEVERITY_STYLES[inc.severity] ||
                      SEVERITY_STYLES.Medium
                    }`}
                  >
                    {inc.severity}
                  </span>

                  <span className="font-mono text-[0.75rem] text-ink-400 dark:text-ink-500">
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOURCES */}
      {tab === 'resources' && (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">

          {canOfferResources ? (
            <ResourceForm onOffered={loadResources} />
          ) : (
            <div className="flex max-w-[460px] items-center gap-3 rounded-2xl border border-ink-200/70 bg-white/80 p-6 text-[0.9rem] text-ink-500 glass-surface dark:border-ink-700/50 dark:bg-ink-800/40 dark:text-ink-300">
              <Info className="h-5 w-5 shrink-0 text-accent-500" />

              <span>
                Only Volunteers, Rescue Teams, and Command Center can offer resources. You can still browse what's available.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4 animate-card-rise">

            <h2 className="text-[1.1rem] font-semibold text-ink-900 dark:text-white">
              Available resources
            </h2>

            {loadingResources && (
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading resources...
              </div>
            )}

            {!loadingResources && resources.length === 0 && (
              <p className="text-[0.9rem] text-ink-400 dark:text-ink-500">
                No resources offered yet.
              </p>
            )}

            {resources.map((res) => (
              <div
                key={res.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-200/60 bg-white/70 px-5 py-4 transition-all hover:border-primary-400 hover:-translate-y-px dark:border-ink-700/40 dark:bg-ink-800/30"
              >

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-ink-900 dark:text-white">
                    {res.type}
                  </span>

                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
                      res.synced
                        ? 'bg-success-500/12 text-success-600 dark:text-success-400'
                        : 'bg-warning-500/12 text-warning-600 dark:text-warning-400'
                    }`}
                  >
                    {res.synced ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}

                    {res.synced ? 'Synced' : 'Pending sync'}
                  </span>

                </div>

                <p className="text-[0.9rem] leading-relaxed text-ink-600 dark:text-ink-200">
                  {res.description}
                </p>

                <span className="font-mono text-[0.75rem] text-ink-400 dark:text-ink-500">
                  {res.quantity} · {new Date(res.createdAt).toLocaleString()}
                </span>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAP */}
      {tab === 'map' && (
        <div>
          <LiveMap
            incidents={incidents}
            resources={resources}
          />

          <p className="mt-4 text-center font-mono text-[0.8rem] text-ink-400 dark:text-ink-500">
            Pins only appear for incidents/resources with a captured location.
          </p>
        </div>
      )}

      {/* COMMAND CENTER */}
      {tab === 'command' && isCommandCenter && (
        <CommandOverview />
      )}
    </div>
  );
}

interface AuthFormState {
  name: string;
  email: string;
  password: string;
  role: string;
}

function AuthScreen({
  onLogin,
}: {
  onLogin: (user: User) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [form, setForm] = useState<AuthFormState>({
    name: '',
    email: '',
    password: '',
    role: 'Victim',
  });

  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setStatus(null);

    try {
      const endpoint =
        mode === 'login'
          ? 'login'
          : 'register';

      const body =
        mode === 'login'
          ? {
              email: form.email,
              password: form.password,
            }
          : form;

      const res = await fetch(
        `${API_BASE}/auth/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message:
            data.error ||
            'Something went wrong',
        });

        return;
      }

      localStorage.setItem(
        'meshalert_token',
        data.token
      );

      localStorage.setItem(
        'meshalert_meshid',
        data.user.meshId
      );

      onLogin(data.user as User);

    } catch (error) {
      console.error(error);

      setStatus({
        type: 'error',
        message:
          'Could not reach the server. Is it running?',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-12 overflow-hidden px-6 py-16 transition-colors">

      {/* Background */}
      <div className="absolute inset-0 bg-ink-50 dark:bg-ink-950" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(91,112,128,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(91,112,128,0.20),transparent_60%)]" />

      {/* Theme toggle */}
      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center animate-hero-rise">

        <SignalPulse size={140} active />

        <h1 className="mt-2 font-display text-[clamp(2.5rem,5vw,3.5rem)] font-bold text-ink-900 dark:text-white">
          MeshAlert
        </h1>

        <p className="flex items-center gap-2 font-mono text-[0.9rem] text-ink-500 dark:text-ink-400">
          <Radio className="h-4 w-4 text-primary-500" />
          Coordination that doesn't need a signal tower.
        </p>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[20px] border border-ink-200/70 bg-white/80 p-8 shadow-2xl shadow-ink-900/10 glass-surface animate-card-rise dark:border-ink-700/50 dark:bg-ink-800/40 dark:shadow-black/40">

        <div className="mb-7 flex gap-2 rounded-xl bg-ink-100/80 p-1 dark:bg-ink-900/50">

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setStatus(null);
            }}
            className={`flex-1 rounded-lg py-[0.6rem] text-[0.9rem] font-medium transition-all ${
              mode === 'login'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-white'
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setStatus(null);
            }}
            className={`flex-1 rounded-lg py-[0.6rem] text-[0.9rem] font-medium transition-all ${
              mode === 'register'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-white'
            }`}
          >
            Register
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[1.1rem]"
        >

          {mode === 'register' && (
            <label className="flex flex-col gap-[0.4rem]">

              <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
                Name
              </span>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white"
              />

            </label>
          )}

          <label className="flex flex-col gap-[0.4rem]">

            <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
              Email
            </span>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white"
            />

          </label>

          <label className="flex flex-col gap-[0.4rem]">

            <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
              Password
            </span>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white"
            />

          </label>

          {mode === 'register' && (
            <label className="flex flex-col gap-[0.4rem]">

              <span className="text-[0.8rem] font-medium text-ink-500 dark:text-ink-300">
                Role
              </span>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-xl border border-ink-200 bg-ink-50/60 px-[0.85rem] py-[0.7rem] text-[0.95rem] text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-white"
              >
                <option>Victim</option>
                <option>Volunteer</option>
                <option>Rescue Team</option>
                <option>Command Center</option>
              </select>

            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-[0.85rem] text-[0.95rem] font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}

          </button>

          {status && (
            <p
              className={`flex items-center gap-2 rounded-lg px-3 py-[0.6rem] text-center text-[0.85rem] animate-status-in ${
                status.type === 'error'
                  ? 'bg-danger-500/12 text-danger-600 dark:text-danger-400'
                  : status.type === 'success'
                  ? 'bg-success-500/12 text-success-600 dark:text-success-400'
                  : 'bg-warning-500/12 text-warning-600 dark:text-warning-400'
              }`}
            >
              {status.message}
            </p>
          )}

        </form>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  function handleLogout() {
    localStorage.removeItem('meshalert_token');
    localStorage.removeItem('meshalert_meshid');

    setUser(null);
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default App;