import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    driverId: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isDriving: { type: Boolean, default: false },
    lastUpdate: { type: Date, default: Date.now }
});

export const Location = mongoose.model('Location', locationSchema);
