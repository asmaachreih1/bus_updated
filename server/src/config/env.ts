import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true }); // Local server .env takes precedence

const parsedPort = Number(process.env.PORT);

export const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3003;
export const JWT_SECRET = process.env.JWT_SECRET;
export const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
}
