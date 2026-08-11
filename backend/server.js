require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const meshRoutes = require('./routes/mesh');
const incidentRoutes = require('./routes/incidents');
const resourceRoutes = require('./routes/resources');
const commandRoutes = require('./routes/command');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'meshalert-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/mesh', meshRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/command', commandRoutes);

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[server] MeshAlert backend running on port ${PORT}`);
  });

  const peerServer = ExpressPeerServer(server, { path: '/mesh' });
  app.use('/peerjs', peerServer);
});