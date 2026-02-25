// seed.js - creates a test cluster and adds fake members with locations
const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String, role: String, email: { type: String, unique: true },
    password: { type: String, required: true }, capacity: Number,
    createdAt: { type: Date, default: Date.now }, clusterId: String
});
const ClusterSchema = new mongoose.Schema({
    code: { type: String, unique: true }, name: String, driverId: String, members: [String]
});
const MemberLocationSchema = new mongoose.Schema({
    id: { type: String, unique: true }, lat: Number, lng: Number, name: String,
    arrived: Boolean, selectedVanId: String, lastUpdated: Date
});
const VanLocationSchema = new mongoose.Schema({
    id: { type: String, unique: true }, lat: Number, lng: Number, isDriving: Boolean, lastUpdated: Date
});

const User = mongoose.model('User', UserSchema);
const Cluster = mongoose.model('Cluster', ClusterSchema);
const MemberLocation = mongoose.model('MemberLocation', MemberLocationSchema);
const VanLocation = mongoose.model('VanLocation', VanLocationSchema);

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    // Create test users
    const users = [
        { id: 'user_sara', name: 'Sara Khalil', role: 'user', email: 'sara@example.com', password: 'pass' },
        { id: 'user_ali', name: 'Ali Hassan', role: 'user', email: 'ali@example.com', password: 'pass' },
        { id: 'user_maya', name: 'Maya Nasser', role: 'user', email: 'maya@example.com', password: 'pass' },
    ];
    for (const u of users) {
        await User.findOneAndUpdate({ id: u.id }, u, { upsert: true });
        console.log('Upserted user:', u.name);
    }

    // Create driver + van location (Beirut area)
    await User.findOneAndUpdate({ id: 'driver_1' },
        { id: 'driver_1', name: 'Ahmed Driver', role: 'driver', email: 'driver@example.com', password: 'pass', capacity: 8 },
        { upsert: true });
    await VanLocation.findOneAndUpdate({ id: 'driver_1' },
        { id: 'driver_1', lat: 33.8886, lng: 35.4955, isDriving: true, lastUpdated: new Date() },
        { upsert: true });
    console.log('Upserted driver');

    // Create cluster
    let cluster = await Cluster.findOne({ driverId: 'driver_1' });
    if (!cluster) {
        cluster = await Cluster.create({ code: 'TEST01', name: 'Morning Route A', driverId: 'driver_1', members: ['user_sara', 'user_ali', 'user_maya'] });
    } else {
        cluster.members = ['user_sara', 'user_ali', 'user_maya'];
        cluster.name = 'Morning Route A';
        await cluster.save();
    }
    console.log('Cluster code:', cluster.code);

    // Place members at different Beirut locations
    const locations = [
        { id: 'user_sara', name: 'Sara Khalil', lat: 33.8800, lng: 35.4800 },
        { id: 'user_ali', name: 'Ali Hassan', lat: 33.8950, lng: 35.5100 },
        { id: 'user_maya', name: 'Maya Nasser', lat: 33.8700, lng: 35.5000 },
    ];
    for (const loc of locations) {
        await MemberLocation.findOneAndUpdate({ id: loc.id },
            { ...loc, arrived: false, selectedVanId: 'driver_1', lastUpdated: new Date() },
            { upsert: true });
        console.log('Set location for', loc.name);
    }

    console.log('\n✅ Done! Cluster code:', cluster.code);
    await mongoose.disconnect();
}

seed().catch(console.error);
