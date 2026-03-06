import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_SECRET } from '../config/env';
import { supabase } from '../config/supabase';
import { SafeUser, UserRole } from '../types/db';

class ServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function handleDbError(err: any): never {
  console.error('Database Error:', err);
  throw new ServiceError(500, err.message || 'An internal database error occurred');
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
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    capacity: parseInt(String(user.capacity), 10) || 0,
    clusterId: user.cluster_id,
  };
}

function parseCapacity(role: UserRole, capacity: unknown): number {
  if (role !== 'driver') return 0;
  const parsed = parseInt(String(capacity), 10);
  // Default to 14 ONLY if the input is not a valid number > 0
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
  role?: UserRole;
};

export async function signup(payload: SignupPayload): Promise<SafeUser> {
  const { id, name, role, email, password, capacity } = payload || {};

  if (!name || !email || !password || !role) {
    throw new ServiceError(400, 'Please provide all required fields (Name, Email, Password, Role)');
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

  // Check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows found"
    handleDbError(checkError);
  }

  if (existingUser) {
    throw new ServiceError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const newUser = {
    id: String(id || '').trim() || createUserId(),
    name: String(name).trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role,
    capacity: parseCapacity(role, capacity),
  };

  const { data, error } = await supabase
    .from('users')
    .insert([newUser])
    .select()
    .single();

  if (error) {
    handleDbError(error);
  }

  return sanitizeUser(data);
}

export async function login(payload: LoginPayload): Promise<{ user: SafeUser; token: string }> {
  const { email, password, role } = payload || {};

  if (!email || !password) {
    throw new ServiceError(400, 'Email and Password are required for login');
  }

  const normalizedEmail = normalizeEmail(email);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ServiceError(401, 'No account found with this email address');
    }
    handleDbError(error);
  }

  // Role validation
  if (role && user.role !== role) {
    throw new ServiceError(403, `This account is registered as a ${user.role}. Please use the correct login portal.`);
  }

  const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

  if (!isPasswordValid) {
    throw new ServiceError(401, 'Incorrect password. Please try again.');
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
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    handleDbError(error);
  }

  return (data || []).map(user => sanitizeUser(user));
}

