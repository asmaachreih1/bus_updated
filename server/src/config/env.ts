import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const parsedPort = Number(process.env.PORT);

export const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-jwt-secret-in-env';
