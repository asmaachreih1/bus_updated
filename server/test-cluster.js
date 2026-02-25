require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');

const MONGO_URI = process.env.MONGODB_URI;
const API_URL = "http://localhost:3001"; // Or whatever the port is from .env

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    role: String,
    clusterId: String
});
const User = mongoose.model('User', userSchema);

const clusterSchema = new mongoose.Schema({
    code: String,
    name: String,
    driverId: String,
    capacity: Number
});
const Cluster = mongoose.model('Cluster', clusterSchema);

const attendanceSchema = new mongoose.Schema({
    userId: String,
    clusterId: String,
    status: String
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

const locationSchema = new mongoose.Schema({
    driverId: String,
    lat: Number,
    lng: Number,
    isDriving: Boolean,
    lastUpdate: { type: Date, default: Date.now }
});
const Location = mongoose.model('Location', locationSchema);

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const clusterCode = "TEST99";
        const driverId = "dummy-driver-id";

        // 1. Create dummy cluster
        await Cluster.findOneAndDelete({ code: clusterCode });
        await Cluster.create({
            code: clusterCode,
            name: "Morning Route A",
            driverId: driverId,
            capacity: 12
        });

        // 2. Start Trip (Active Location)
        await Location.findOneAndDelete({ driverId: driverId });
        await Location.create({
            driverId: driverId,
            lat: 33.8938, // Sample Beirut Lat
            lng: 35.5018, // Sample Beirut Lng
            isDriving: true,
            lastUpdate: new Date()
        });

        // 3. Create dummy users and attendance
        const commonNames = [
            "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince",
            "Ethan Hunt", "Fiona Gallagher", "George Costanza", "Hannah Abbott",
            "Ian Somerhalder", "Julia Roberts"
        ];

        for (let i = 0; i < 10; i++) {
            const userId = `dummy-${i + 1}`;
            const name = commonNames[i];

            await User.findOneAndDelete({ id: userId });
            await User.create({
                id: userId,
                name: name,
                email: `${userId}@test.com`,
                role: "user",
                clusterId: clusterCode
            });

            await Attendance.findOneAndDelete({ userId: userId });

            // Force it so at least 7 are "coming" to show a good capacity count
            const status = i < 7 ? "coming" : (i === 8 ? "not_coming" : null);

            if (status) {
                await Attendance.create({
                    userId: userId,
                    clusterId: clusterCode,
                    status: status
                });
            }

            // --- ADDED: Push to active tracking system ---
            const postData = JSON.stringify({
                id: userId,
                name: name,
                lat: 33.8938 + (Math.random() - 0.5) * 0.01,
                lng: 35.5018 + (Math.random() - 0.5) * 0.01,
                selectedVanId: driverId
            });

            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/update-member',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                }
            };

            const req = http.request(options);
            req.write(postData);
            req.end();
            // --------------------------------------------
        }

        console.log(`\n✅ TRIP STARTED & CLUSTER POPULATED!`);
        console.log(`\n================================`);
        console.log(`🚌 CLUSTER NAME: Morning Route A`);
        console.log(`🔑 JOIN CODE   : ${clusterCode}`);
        console.log(`👥 MEMBERS     : 10 Added`);
        console.log(`📍 DRIVER STATUS: Active & Driving`);
        console.log(`================================\n`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
