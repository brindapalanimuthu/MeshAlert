# 🛰️ MeshAlert — Offline-First Disaster Coordination Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white)

## 📌 Module Overview

MeshAlert coordinates disaster response when the internet and cell towers go down. It is responsible for:

- **Mesh Network Core**: Peer-to-peer device relay over WebRTC (via PeerJS), with heartbeat polling and live peer discovery — so incident and resource data can hop device-to-device without a central connection.
- **Offline-First Storage & Sync**: Every incident and resource report is written to local IndexedDB (via Dexie.js) first, queued, and synced to the backend automatically the moment connectivity returns — with `clientId` dedup keys to prevent double-writes on retry.
- **Role-Based Auth**: JWT-based authentication with four roles — Victim, Volunteer, Rescue Team, Command Center — each with a distinct `meshId` and scoped permissions.
- **Incident Reporting**: Structured incident capture (type, severity, description, GPS location) tracked through Reported → Acknowledged → In Progress → Resolved.
- **Resource Management**: Volunteers and responders can offer, list, claim, and update the status of supplies (water, medical aid, shelter, transport).
- **Live Map & Geospatial View**: Incidents and resources plotted on a React-Leaflet map, severity-colored, using Turf.js for geospatial helpers.
- **Command Center Dashboard**: Role-gated, system-wide overview — total incidents/resources, severity breakdowns, active peer count, and full live/historical lists.

## 🏗️ Architecture & Component Breakdown

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                            FRONTEND / CLIENT DEVICES                        │
 │  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
 │  │ Victim / Volunteer /      │         │ Command Center Dashboard       │  │
 │  │ Rescue Team Devices       │◄───────►│ (Live Overview & Peer Status)  │  │
 │  │ (Offline-first, Dexie.js) │  WebRTC │                                 │  │
 │  └─────────────┬─────────────┘  Mesh   └────────────────┬────────────────┘  │
 └────────────────┼───────────────────────────────────────┼───────────────────┘
                  │ Sync when online                       │ REST APIs
                  ▼                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                        BACKEND API SERVER (Express / Node.js)               │
 │  ┌───────────────────────┐ ┌────────────────────────┐ ┌──────────────────┐  │
 │  │ Auth & Role           │ │ Incident & Resource    │ │ Mesh Peer &      │  │
 │  │ Management (JWT)      │ │ Reporting Service      │ │ Command Overview │  │
 │  └───────────┬───────────┘ └───────────┬────────────┘ └────────┬─────────┘  │
 └──────────────┼─────────────────────────┼───────────────────────┼────────────┘
                │                         │                       │
                ▼                         ▼                       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                PERSISTENCE                                  │
 │  ┌─────────────────────────────────────────────────────────────────────┐    │
 │  │ MongoDB Atlas (Mongoose)                                            │    │
 │  │ - User (roles, meshId, bcrypt-hashed password)                     │    │
 │  │ - Incident (type, severity, status, location, clientId)            │    │
 │  │ - Resource (type, quantity, status, claimedBy, clientId)           │    │
 │  │ - Peer (meshId, heartbeat, status)                                 │    │
 │  └─────────────────────────────────────────────────────────────────────┘    │
 └─────────────────────────────────────────────────────────────────────────────┘
```

## 📂 Directory Structure

- `backend/` — Express + MongoDB API server: auth, incidents, resources, mesh peers, command overview.
- `frontend/` — React + Vite + TypeScript client: offline-first UI, live map, dashboards.

## 🛠️ Technology Stack

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB) — offline storage & sync queue
- PeerJS (WebRTC) — peer-to-peer mesh networking
- React-Leaflet + Turf.js — live map & geospatial logic
- Lucide Icons

**Backend**
- Node.js + Express
- MongoDB Atlas (via Mongoose)
- JWT-based authentication, bcrypt password hashing

## 🔌 Core API Endpoints

### 1. Auth & Role Management
- `POST /api/auth/register` — Register a new user (name, email, password, role); returns a JWT and generates a `meshId`.
- `POST /api/auth/login` — Authenticate and receive a JWT.
- `GET /api/auth/me` — Fetch the authenticated user's profile.

### 2. Mesh Network Core
- `POST /api/peers/register` — Register a device on the mesh network.
- `POST /api/peers/heartbeat` — Send a liveness heartbeat for a peer.
- `GET /api/peers` — List currently active peers.

### 3. Incident Reporting
- `POST /api/incidents` — Report a new incident (type, severity, description, location, `clientId` for offline dedup).
- `GET /api/incidents` — List incidents, optionally filtered by `status`.
- `PATCH /api/incidents/:id` — Update incident status/assignment (Rescue Team, Command Center, Volunteer only).

### 4. Resource Management
- `POST /api/resources` — Offer a resource (Volunteer, Rescue Team, Command Center only).
- `GET /api/resources` — List resources, optionally filtered by `status` or `type`.
- `PATCH /api/resources/:id/claim` — Claim an available resource.
- `PATCH /api/resources/:id` — Update resource status directly (e.g. mark Depleted).

### 5. Command Center
- `GET /api/command/overview` — Full system snapshot: incident/resource counts by status and severity, active peer count, and complete incident/resource/peer lists (Command Center role only).

## 🚀 Step-by-Step Setup & Running Independently

### Prerequisites
- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB v6+)

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment variables (.env)
```

Sample `.env` configuration:
```
PORT=5001
MONGODB_URI="your_mongodb_atlas_connection_string"
JWT_SECRET="your_jwt_secret"
```

```bash
npm start
```

The Backend API server will start on `http://localhost:5001`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on Vite's dev server at `http://localhost:5173`, talking to the backend at `http://localhost:5001/api`.

## 👥 Roles & Permissions

| Role | Permissions |
|---|---|
| **Victim** | Report incidents, browse available resources |
| **Volunteer** | Report incidents, offer & claim resources |
| **Rescue Team** | Report incidents, offer & claim resources, update incident status |
| **Command Center** | All of the above, plus full system-wide dashboard access |

## 🧪 Verification & Testing

```bash
cd backend

# Sanity-check core endpoints via curl
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@mesh.local","password":"password123","role":"Volunteer"}'
```

## 📈 Status

Actively developed. All core modules — Auth, Mesh Network Core, Offline Storage & Sync, Incident Reporting, Resource Management, Live Map, and Command Center Dashboard — are built and verified end-to-end.

## 📄 License

Not yet specified.
