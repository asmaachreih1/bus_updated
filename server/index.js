const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage
let vanLocations = {
  1: { id: 1, lat: 33.8938, lng: 35.5018, lastUpdated: new Date() }
};

let memberLocations = {};

// Get all data (Bus + Members)
app.get('/api/vans', (req, res) => {
  res.json({
    vans: Object.values(vanLocations),
    members: Object.values(memberLocations)
  });
});

// Update member location
app.post('/api/update-member', (req, res) => {
  const { id, lat, lng, name, arrived } = req.body;
  if (!id || !lat || !lng) return res.status(400).json({ error: 'Missing data' });

  // Keep existing arrival status if not provided
  const previouslyArrived = memberLocations[id]?.arrived || false;

  memberLocations[id] = {
    id,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name || 'Friend',
    arrived: arrived !== undefined ? arrived : previouslyArrived,
    lastUpdated: new Date()
  };
  res.json({ success: true });
});

// Explicitly mark as arrived
app.post('/api/mark-arrived', (req, res) => {
  const { id } = req.body;
  if (!id || !memberLocations[id]) return res.status(404).json({ error: 'Member not found' });

  memberLocations[id].arrived = true;
  res.json({ success: true });
});

// Update van location
app.post('/api/update-location', (req, res) => {
  const { van_id, lat, lng } = req.body;

  const targetId = van_id || req.body.van_id;
  const targetLat = lat || req.body.lat;
  const targetLng = lng || req.body.lng;

  if (!targetId || !targetLat || !targetLng) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  vanLocations[targetId] = {
    id: parseInt(targetId),
    lat: parseFloat(targetLat),
    lng: parseFloat(targetLng),
    lastUpdated: new Date()
  };

  res.json({ success: true });
});

// Reset all data
app.get('/api/reset', (req, res) => {
  vanLocations = {
    1: { id: 1, lat: 33.8938, lng: 35.5018, lastUpdated: new Date() }
  };
  memberLocations = {};
  res.json({ success: true, message: 'Simulation reset' });
});

app.get('/', (req, res) => {
  res.send('Van Tracker Backend is Running...');
});

app.listen(port, () => {
  console.log(`Van Tracker Backend listening at http://localhost:${port}`);
});
