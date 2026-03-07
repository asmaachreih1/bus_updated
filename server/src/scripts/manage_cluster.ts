import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Cluster from '../models/Cluster';
import { ClusterService } from '../services/cluster.service';

dotenv.config();

async function run() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in environment');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Ensure driver exists
        let driver = await User.findOne({ email: 'driver@example.com' });
        if (!driver) {
            driver = new User({
                id: 'driver_stable',
                name: 'Stable Driver',
                email: 'driver@example.com',
                password_hash: 'hashed_password', // In a real script we'd hash it
                role: 'driver',
                capacity: 10
            });
            await driver.save();
            console.log('👤 Created driver:', driver.email);
        }

        // 2. Ensure stable@example.com exists
        let member = await User.findOne({ email: 'stable@example.com' });
        if (!member) {
            member = new User({
                id: 'user_stable',
                name: 'Stable User',
                email: 'stable@example.com',
                password_hash: 'hashed_password',
                role: 'user'
            });
            await member.save();
            console.log('👤 Created member:', member.email);
        }

        // 3. Create cluster
        const clusterName = 'Stable Cluster ' + Math.floor(Math.random() * 1000);
        const cluster = await ClusterService.create({
            name: clusterName,
            driverId: driver.id,
            code: 'CODE' + Math.floor(Math.random() * 1000)
        });
        console.log(`🚀 Created cluster "${clusterName}" with code: ${cluster.code}`);

        // 4. Add stable@example.com to cluster
        await ClusterService.join(cluster.code, member.id);
        console.log(`✅ Added ${member.email} to cluster ${cluster.code}`);

        console.log('\nFinal State:');
        console.log('Cluster Code:', cluster.code);

        const updatedMember = await User.findOne({ id: member.id });
        console.log('Member Cluster Code:', updatedMember?.cluster_id);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
