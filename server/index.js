require('dotenv').config();
const express = require('express');
const cors = require('cors');      
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

// ✅ Middleware FIRST
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// ✅ Stripe routes AFTER middleware
const stripeRoutes = require('./stripeRoutes');
app.use('/api/stripe', stripeRoutes);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Helper: Read/Write DB
function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: {}, clusters: {}, attendance: {}, vanLocations: {}, memberLocations: {}, reports: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.reports) db.reports = [];
  return db;
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/vans', (req, res) => {
  const db = readDb();
  res.json({
    vans: Object.values(db.vanLocations),
    members: Object.values(db.memberLocations)
  });
});

app.post('/api/signup', (req, res) => {
  const { id, name, role, email, password, capacity } = req.body;
  if (!id || !name || !role) return res.status(400).json({ error: 'Missing data' });

  const db = readDb();
  db.users[id] = { id, name, role, email, password, capacity: parseInt(capacity) || 0, createdAt: new Date() };
  writeDb(db);
  res.json({ success: true, user: db.users[id] });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = Object.values(db.users).find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user });
});

app.post('/api/update-location', (req, res) => {
  const { van_id, lat, lng, isDriving } = req.body;
  const db = readDb();
  db.vanLocations[van_id] = {
    id: van_id,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    isDriving: !!isDriving,
    lastUpdated: new Date()
  };
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/update-member', (req, res) => {
  const { id, lat, lng, name, arrived } = req.body;
  const db = readDb();
  const previouslyArrived = db.memberLocations[id]?.arrived || false;
  db.memberLocations[id] = {
    id,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name || 'Friend',
    arrived: arrived !== undefined ? arrived : previouslyArrived,
    lastUpdated: new Date()
  };
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/clusters/create', (req, res) => {
  const { name, driverId } = req.body;
  const db = readDb();
  const clusterId = Math.random().toString(36).substring(7);
  db.clusters[clusterId] = { id: clusterId, name, driverId, members: [] };
  writeDb(db);
  res.json({ success: true, cluster: db.clusters[clusterId] });
});

app.post('/api/clusters/join', (req, res) => {
  const { clusterId, userId } = req.body;
  const db = readDb();
  if (!db.clusters[clusterId]) return res.status(404).json({ error: 'Cluster not found' });
  if (!db.clusters[clusterId].members.includes(userId)) {
    db.clusters[clusterId].members.push(userId);
  }
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/attendance', (req, res) => {
  const { userId, status } = req.body; // status: 'coming' | 'not_coming'
  const db = readDb();
  const today = new Date().toISOString().split('T')[0];
  if (!db.attendance[today]) db.attendance[today] = {};
  db.attendance[today][userId] = status;
  writeDb(db);
  res.json({ success: true });
});

app.get('/api/attendance', (req, res) => {
  const db = readDb();
  const today = new Date().toISOString().split('T')[0];
  res.json(db.attendance[today] || {});
});

app.post('/api/reports', (req, res) => {
  const { userId, userName, type, message } = req.body;
  const db = readDb();
  const report = {
    id: Math.random().toString(36).substring(7),
    userId,
    userName,
    type,
    message,
    timestamp: new Date(),
    status: 'pending'
  };
  db.reports.push(report);
  writeDb(db);
  res.json({ success: true, report });
});

app.get('/api/reports', (req, res) => {
  const db = readDb();
  res.json(db.reports || []);
});

app.post('/api/reports/resolve', (req, res) => {
  const { reportId } = req.body;
  const db = readDb();
  const report = db.reports.find(r => r.id === reportId);
  if (report) {
    report.status = 'resolved';
    writeDb(db);
  }
  res.json({ success: true });
});

app.get('/api/reset', (req, res) => {
  const initial = { users: {}, clusters: {}, attendance: {}, vanLocations: {}, memberLocations: {}, reports: [] };
  writeDb(initial);
  res.json({ success: true, message: 'Simulation reset' });
});

app.get('/', (req, res) => res.send('Tracker Backend is Running...'));

app.listen(port, () => console.log(`Backend listening at http://localhost:${port}`));
