import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_SECRET } from '../config/env';
import { readDB, writeDB } from '../utils/fileDB';
import { DbUser, SafeUser, UserRole } from '../types/db';

class ServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function createUserId(): string {
  if (typeof randomUUID === 'function') return randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function sanitizeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    capacity: parseInt(String(user.capacity), 10) || 0,
  };
}

function findUserByEmail(users: DbUser[], email: unknown): DbUser | null {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

function parseCapacity(role: UserRole, capacity: unknown): number {
  if (role !== 'driver') return 0;
  const parsed = parseInt(String(capacity), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
}

type SignupPayload = {
  id?: string;
  name?: string;
  role?: UserRole;
  email?: string;
  password?: string;
  capacity?: number | string;
};

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function signup(payload: SignupPayload): Promise<SafeUser> {
  const { id, name, role, email, password, capacity } = payload || {};

  if (!name || !email || !password || !role) {
    throw new ServiceError(400, 'Missing required fields');
  }

  if (String(password).length < 6) {
    throw new ServiceError(400, 'Password must be at least 6 characters');
  }

  if (!['user', 'driver', 'admin'].includes(role)) {
    throw new ServiceError(400, 'Invalid role');
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new ServiceError(400, 'Invalid email');
  }

  const db = readDB();
  if (findUserByEmail(db.users, normalizedEmail)) {
    throw new ServiceError(409, 'Email already exists');
  }

  const user: DbUser = {
    id: String(id || '').trim() || createUserId(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(String(password), 10),
    role,
    capacity: parseCapacity(role, capacity),
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  writeDB(db);
  return sanitizeUser(user);
}

export async function login(payload: LoginPayload): Promise<{ user: SafeUser; token: string }> {
  const { email, password } = payload || {};

  if (!email || !password) {
    throw new ServiceError(400, 'Missing credentials');
  }

  const db = readDB();
  const user = findUserByEmail(db.users, email);
  if (!user) {
    throw new ServiceError(401, 'Invalid credentials');
  }

  let isPasswordValid = false;
  let didMutate = false;

  if (user.passwordHash) {
    isPasswordValid = await bcrypt.compare(String(password), user.passwordHash);
  } else if (user.password) {
    isPasswordValid = String(user.password) === String(password);
    if (isPasswordValid) {
      user.passwordHash = await bcrypt.hash(String(password), 10);
      delete user.password;
      didMutate = true;
    }
  }

  if (!isPasswordValid) {
    throw new ServiceError(401, 'Invalid credentials');
  }

  if (didMutate) {
    writeDB(db);
  }

  const safeUser = sanitizeUser(user);
  const token = jwt.sign(
    { sub: safeUser.id, email: safeUser.email, role: safeUser.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { user: safeUser, token };
}

export function listUsers(): SafeUser[] {
  const db = readDB();
  return db.users.map(sanitizeUser);
}
