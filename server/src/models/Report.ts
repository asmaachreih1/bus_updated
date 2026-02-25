import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    timestamp: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', reportSchema);
