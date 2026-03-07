import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
    user_id: string;
    lat: number;
    lng: number;
    isDriving: boolean;
    name?: string; // For members
    arrived?: boolean; // For members
    selectedVanId?: string; // For members
    destination?: string; // For drivers
    destLat?: number; // For drivers
    destLng?: number; // For drivers
    updated_at: Date;
}

const LocationSchema: Schema = new Schema({
    user_id: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isDriving: { type: Boolean, default: false },
    name: { type: String },
    arrived: { type: Boolean, default: false },
    selectedVanId: { type: String },
    destination: { type: String },
    destLat: { type: Number },
    destLng: { type: Number },
}, { timestamps: { createdAt: false, updatedAt: 'updated_at' } });

export default mongoose.model<ILocation>('Location', LocationSchema);
