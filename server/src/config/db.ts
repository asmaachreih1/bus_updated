import mongoose from 'mongoose';

export const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    try {
        console.log('🔌 Connecting to MongoDB with URI:', MONGODB_URI);
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env');
            return;
        }
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (err: any) {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (err.cause) console.error('🔍 Cause:', err.cause);
    }
};
