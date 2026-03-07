import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    cluster_id: string;
    user_id: string;
    status: string;
    date: string;
}

const AttendanceSchema: Schema = new Schema({
    cluster_id: { type: String, required: true },
    user_id: { type: String, required: true },
    status: { type: String, required: true },
    date: { type: String, required: true },
}, { timestamps: true });

// Composite index for uniqueness
AttendanceSchema.index({ cluster_id: 1, user_id: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
