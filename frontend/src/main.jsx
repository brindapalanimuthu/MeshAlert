import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { setupAutoSync, flushSyncQueue } from './db/syncEngine';
import 'leaflet/dist/leaflet.css';

setupAutoSync();
// Try an initial flush in case there's already a queue from a previous session
flushSyncQueue();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);