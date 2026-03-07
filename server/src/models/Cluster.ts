import mongoose, { Schema, Document } from 'mongoose';

export interface ICluster extends Document {
    id: string;
    name: string;
    driver_id: string;
    code: string;
}

const ClusterSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    driver_id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model<ICluster>('Cluster', ClusterSchema);
