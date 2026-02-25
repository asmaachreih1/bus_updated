import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    clusterId: { type: String, required: true },
    status: { type: String, enum: ['coming', 'not_coming'], required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    timestamp: { type: Date, default: Date.now }
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
