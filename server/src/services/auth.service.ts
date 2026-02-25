import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_SECRET } from '../config/env';
import { User } from '../models/User';
import { SafeUser, UserRole } from '../types/db';

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

function sanitizeUser(user: any): SafeUser {
  return {
    id: user.id || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    capacity: parseInt(String(user.capacity), 10) || 0,
    clusterId: user.clusterId,
  };
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

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ServiceError(409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const newUser = new User({
    id: String(id || '').trim() || createUserId(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    capacity: parseCapacity(role, capacity),
  });

  await newUser.save();
  return sanitizeUser(newUser);
}

export async function login(payload: LoginPayload): Promise<{ user: SafeUser; token: string }> {
  const { email, password } = payload || {};

  if (!email || !password) {
    throw new ServiceError(400, 'Missing credentials');
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ServiceError(401, 'Invalid credentials');
  }

  let isPasswordValid = false;

  if (user.passwordHash) {
    isPasswordValid = await bcrypt.compare(String(password), user.passwordHash);
  } else if (user.password) {
    // Legacy support
    isPasswordValid = String(user.password) === String(password);
    if (isPasswordValid) {
      user.passwordHash = await bcrypt.hash(String(password), 10);
      user.password = undefined;
      await user.save();
    }
  }

  if (!isPasswordValid) {
    throw new ServiceError(401, 'Invalid credentials');
  }

  const safeUser = sanitizeUser(user);
  const token = jwt.sign(
    { sub: safeUser.id, email: safeUser.email, role: safeUser.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { user: safeUser, token };
}

export async function listUsers(): Promise<SafeUser[]> {
  const users = await User.find({});
  return users.map(user => sanitizeUser(user));
}
