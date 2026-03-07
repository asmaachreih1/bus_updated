import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    id: string; // Keep manual ID for compatibility
    name: string;
    email: string;
    password_hash: string;
    role: string;
    capacity: number;
    cluster_id?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'driver', 'admin'] },
    capacity: { type: Number, default: 0 },
    cluster_id: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
