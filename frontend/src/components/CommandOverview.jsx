import { useState, useEffect } from 'react';
import './CommandOverview.css';

const API_BASE = 'http://localhost:5001/api';

function CommandOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
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
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="command-overview__loading">Loading system overview…</p>;
  if (error) return <p className="command-overview__error">{error}</p>;
  if (!data) return null;

  const { summary, incidents, resources, peers } = data;

  return (
    <div className="command-overview">
      <div className="command-overview__stats">
        <div className="stat-card">
          <span className="stat-card__value">{summary.totalIncidents}</span>
          <span className="stat-card__label">Total incidents</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{summary.totalResources}</span>
          <span className="stat-card__label">Total resources</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{summary.activePeers}</span>
          <span className="stat-card__label">Active peers</span>
        </div>
      </div>

      <div className="command-overview__section">
        <h3>Incidents by severity</h3>
        <div className="breakdown-row">
          {Object.entries(summary.incidentsBySeverity).map(([sev, count]) => (
            <span key={sev} className={`severity-chip severity-chip--${sev.toLowerCase()}`}>
              {sev}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="command-overview__grid">
        <div className="command-overview__list">
          <h3>All incidents ({incidents.length})</h3>
          {incidents.map((inc) => (
            <div className="command-row" key={inc._id}>
              <div>
                <strong>{inc.type}</strong> · {inc.severity}
                <p>{inc.description}</p>
              </div>
              <span className={`status-chip status-chip--${inc.status.toLowerCase().replace(' ', '-')}`}>
                {inc.status}
              </span>
            </div>
          ))}
        </div>

        <div className="command-overview__list">
          <h3>All resources ({resources.length})</h3>
          {resources.map((res) => (
            <div className="command-row" key={res._id}>
              <div>
                <strong>{res.type}</strong> · {res.quantity}
                <p>{res.description}</p>
              </div>
              <span className={`status-chip status-chip--${res.status.toLowerCase()}`}>
                {res.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="refresh-btn" onClick={load}>Refresh overview</button>
    </div>
  );
}

export default CommandOverview;