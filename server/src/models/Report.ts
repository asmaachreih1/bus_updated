import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    id: string;
    user_id: string;
    user_name?: string;
    type: string;
    message: string;
    status: string;
    created_at: Date;
}

const ReportSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    user_name: { type: String },
    type: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'pending' },
}, { timestamps: { createdAt: 'created_at' } });

export default mongoose.model<IReport>('Report', ReportSchema);
