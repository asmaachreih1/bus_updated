import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Plain text for now to match current logic, will hash in service
    passwordHash: { type: String }, // For Bcrypt migration
    role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
    capacity: { type: Number, default: 0 },
    clusterId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
