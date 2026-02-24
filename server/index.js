require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  role: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  capacity: Number,
  createdAt: { type: Date, default: Date.now },
  clusterId: String // The cluster they belong to
});

const ClusterSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
  driverId: String,
  members: [String] // Array of user IDs
});

const AttendanceSchema = new mongoose.Schema({
  date: String,
  userId: String,
  status: String, // 'coming' | 'not_coming'
  updatedAt: { type: Date, default: Date.now }
});

const VanLocationSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  lat: Number,
  lng: Number,
  isDriving: Boolean,
  lastUpdated: Date
});

const MemberLocationSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  lat: Number,
  lng: Number,
  name: String,
  arrived: Boolean,
  selectedVanId: String,
  lastUpdated: Date
});

const ReportSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  type: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

const User = mongoose.model('User', UserSchema);
const Cluster = mongoose.model('Cluster', ClusterSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const VanLocation = mongoose.model('VanLocation', VanLocationSchema);
const MemberLocation = mongoose.model('MemberLocation', MemberLocationSchema);
const Report = mongoose.model('Report', ReportSchema);

// Routes
app.get('/api/vans', async (req, res) => {
  try {
    const vans = await VanLocation.find();
    const members = await MemberLocation.find();
    res.json({ vans, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { id, name, role, email, password, capacity } = req.body;
    const user = new User({ id, name, role, email, password, capacity: parseInt(capacity) || 0 });
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/update-location', async (req, res) => {
  try {
    const { van_id, lat, lng, isDriving } = req.body;
    await VanLocation.findOneAndUpdate(
      { id: van_id },
      { lat: parseFloat(lat), lng: parseFloat(lng), isDriving: !!isDriving, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/update-member', async (req, res) => {
  try {
    const { id, lat, lng, name, arrived } = req.body;
    const update = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      name: name || 'Friend',
      lastUpdated: new Date()
    };
    if (arrived !== undefined) update.arrived = arrived;

    await MemberLocation.findOneAndUpdate({ id }, update, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/select-van', async (req, res) => {
  try {
    const { userId, vanId } = req.body;
    await MemberLocation.findOneAndUpdate(
      { id: userId },
      { selectedVanId: vanId, lastUpdated: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cluster Routes
app.post('/api/clusters/create', async (req, res) => {
  try {
    const { name, driverId } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cluster = new Cluster({ code, name, driverId, members: [] });
    await cluster.save();
    // Update driver with clusterId if needed, though driverId is on the cluster
    res.json({ success: true, cluster });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clusters/join', async (req, res) => {
  try {
    const { code, userId } = req.body;
    const cluster = await Cluster.findOne({ code });
    if (!cluster) return res.status(404).json({ error: 'Cluster not found' });

    if (!cluster.members.includes(userId)) {
      cluster.members.push(userId);
      await cluster.save();
    }
    res.json({ success: true, cluster });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clusters/driver/:driverId', async (req, res) => {
  try {
    const cluster = await Cluster.findOne({ driverId: req.params.driverId });
    if (!cluster) return res.json({ cluster: null });

    // Fetch member details
    const memberDetails = await User.find({ id: { $in: cluster.members } });
    res.json({ success: true, cluster, members: memberDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clusters/member/:userId', async (req, res) => {
  try {
    const cluster = await Cluster.findOne({ members: req.params.userId });
    res.json({ success: true, cluster });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { userId, status } = req.body;
    const today = new Date().toISOString().split('T')[0];
    await Attendance.findOneAndUpdate(
      { date: today, userId },
      { status, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/:userId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ date: today, userId: req.params.userId });
    res.json({ status: record ? record.status : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/cluster/:clusterId', async (req, res) => {
  try {
    const cluster = await Cluster.findById(req.params.clusterId);
    if (!cluster) return res.status(404).json({ error: 'Cluster not found' });

    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ date: today, userId: { $in: cluster.members } });

    const attendanceMap = {};
    records.forEach(r => {
      attendanceMap[r.userId] = r.status;
    });

    res.json(attendanceMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { userId, userName, type, message } = req.body;
    const report = new Report({ userId, userName, type, message });
    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Tracker Backend is Running with MongoDB...'));

app.listen(port, () => console.log(`Backend listening at http://localhost:${port}`));
