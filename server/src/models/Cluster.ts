import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    driverId: { type: String, required: true },
    members: [{ type: String }], // Array of user IDs
    createdAt: { type: Date, default: Date.now }
});

export const Cluster = mongoose.model('Cluster', clusterSchema);
