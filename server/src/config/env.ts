import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true }); // Local server .env takes precedence

const parsedPort = Number(process.env.PORT);

export const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3003;
export const JWT_SECRET = process.env.JWT_SECRET || 'tracker-default-secret-key-123';
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase environment variables are not defined.');
}
