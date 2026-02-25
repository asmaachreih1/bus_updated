const mongoose = require('mongoose');
require('dotenv').config();

const VanLocationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    lat: Number,
    lng: Number,
    isDriving: Boolean,
    lastUpdated: Date
});

const VanLocation = mongoose.model('VanLocation', VanLocationSchema);

async function checkVans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const vans = await VanLocation.find();
        console.log('Vans in DB:', JSON.stringify(vans, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkVans();
