import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true }); // Local server .env takes precedence

const parsedPort = Number(process.env.PORT);

export const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3003;
export const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-jwt-secret-in-env';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://asmaachreih_db_user:Asmaa123@cluster0.0ybnwpp.mongodb.net/?appName=Cluster0';
