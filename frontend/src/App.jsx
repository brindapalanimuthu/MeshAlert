import { useState, useEffect } from 'react';
import SignalPulse from './components/SignalPulse';
import IncidentForm from './components/IncidentForm';
import ResourceForm from './components/ResourceForm';
import LiveMap from './components/LiveMap';
import CommandOverview from './components/CommandOverview';
import localDB from './db/localDB';
import './App.css';

function Dashboard({ user }) {
  const [tab, setTab] = useState('incidents'); // 'incidents' | 'resources' | 'map' | 'command'
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);

  async function loadIncidents() {
    const all = await localDB.incidents.orderBy('createdAt').reverse().toArray();
    setIncidents(all);
  }

  async function loadResources() {
    const all = await localDB.resources.orderBy('createdAt').reverse().toArray();
    setResources(all);
  }

  useEffect(() => {
    loadIncidents();
    loadResources();
  }, []);

  const canOfferResources = ['Volunteer', 'Rescue Team', 'Command Center'].includes(user.role);
  const isCommandCenter = user.role === 'Command Center';

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <SignalPulse size={56} active={true} />
        <div>
          <h1 className="dashboard__title">MeshAlert</h1>
          <p className="dashboard__subtitle">Signed in as {user.name} · {user.role}</p>
        </div>
      </div>

      <div className="dashboard__tabs">
        <button className={tab === 'incidents' ? 'dtab dtab--active' : 'dtab'} onClick={() => setTab('incidents')}>Incidents</button>
        <button className={tab === 'resources' ? 'dtab dtab--active' : 'dtab'} onClick={() => setTab('resources')}>Resources</button>
        <button className={tab === 'map' ? 'dtab dtab--active' : 'dtab'} onClick={() => setTab('map')}>Live Map</button>
        {isCommandCenter && (
          <button className={tab === 'command' ? 'dtab dtab--active' : 'dtab'} onClick={() => setTab('command')}>Command Center</button>
        )}
      </div>

      {tab === 'incidents' && (
        <div className="dashboard__grid">
          <IncidentForm onReported={loadIncidents} />
          <div className="incident-list">
            <h2 className="incident-list__title">Reported incidents</h2>
            {incidents.length === 0 && <p className="incident-list__empty">No incidents reported yet on this device.</p>}
            {incidents.map((inc) => (
              <div className="incident-card" key={inc.id}>
                <div className="incident-card__row">
                  <span className="incident-card__type">{inc.type}</span>
                  <span className={`sync-badge ${inc.synced ? 'sync-badge--synced' : 'sync-badge--pending'}`}>
                    {inc.synced ? 'Synced' : 'Pending sync'}
                  </span>
                </div>
                <p className="incident-card__desc">{inc.description}</p>
                <span className="incident-card__meta">{inc.severity} · {new Date(inc.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="dashboard__grid">
          {canOfferResources ? (
            <ResourceForm onOffered={loadResources} />
          ) : (
            <div className="incident-list">
              <p className="incident-list__empty">Only Volunteers, Rescue Teams, and Command Center can offer resources. You can still browse what's available.</p>
            </div>
          )}
          <div className="incident-list">
            <h2 className="incident-list__title">Available resources</h2>
            {resources.length === 0 && <p className="incident-list__empty">No resources offered yet on this device.</p>}
            {resources.map((res) => (
              <div className="incident-card" key={res.id}>
                <div className="incident-card__row">
                  <span className="incident-card__type">{res.type}</span>
                  <span className={`sync-badge ${res.synced ? 'sync-badge--synced' : 'sync-badge--pending'}`}>
                    {res.synced ? 'Synced' : 'Pending sync'}
                  </span>
                </div>
                <p className="incident-card__desc">{res.description}</p>
                <span className="incident-card__meta">{res.quantity} · {new Date(res.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'map' && (
        <div>
          <LiveMap incidents={incidents} resources={resources} />
          <p className="map-hint">Pins only appear for incidents/resources with a captured location.</p>
        </div>
      )}

      {tab === 'command' && isCommandCenter && <CommandOverview />}
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Victim' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const endpoint = mode === 'login' ? 'login' : 'register';
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;

      const res = await fetch(`http://localhost:5001/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Something went wrong' });
      } else {
        localStorage.setItem('meshalert_token', data.token);
        localStorage.setItem('meshalert_meshid', data.user.meshId);
        onLogin(data.user);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Could not reach the server. Is it running?' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="hero">
        <SignalPulse size={140} />
        <h1 className="hero__title">MeshAlert</h1>
        <p className="hero__subtitle">Coordination that doesn't need a signal tower.</p>
      </div>

      <div className="auth-card">
        <div className="auth-card__tabs">
          <button className={mode === 'login' ? 'tab tab--active' : 'tab'} onClick={() => { setMode('login'); setStatus(null); }} type="button">Sign in</button>
          <button className={mode === 'register' ? 'tab tab--active' : 'tab'} onClick={() => { setMode('register'); setStatus(null); }} type="button">Register</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="field"><span>Name</span><input name="name" value={form.name} onChange={handleChange} required /></label>
          )}
          <label className="field"><span>Email</span><input name="email" type="email" value={form.email} onChange={handleChange} required /></label>
          <label className="field"><span>Password</span><input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} /></label>
          {mode === 'register' && (
            <label className="field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option>Victim</option><option>Volunteer</option><option>Rescue Team</option><option>Command Center</option>
              </select>
            </label>
          )}
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Connecting…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          {status && <p className={`status status--${status.type}`}>{status.message}</p>}
        </form>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }
  return <Dashboard user={user} />;
}

export default App;