import mongoose from 'mongoose';
import { MONGODB_URI } from './env';

export const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is missing!');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
