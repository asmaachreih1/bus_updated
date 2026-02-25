import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUser() {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    try {
        console.log('🔌 Connecting to MongoDB with NO options...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        await mongoose.disconnect();
    } catch (err: any) {
        console.error('❌ Error:', err.message);
        if (err.cause) console.error('🔍 Cause:', err.cause);
    }
}

checkUser();
