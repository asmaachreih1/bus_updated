import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { DbData, DbUser } from '../types/db';

const SERVER_DIR = path.join(__dirname, '../..');
const DB_PATH = path.join(SERVER_DIR, 'db.json');
const LEGACY_DB_PATH = path.join(__dirname, '../data/db.json');

export function createInitialDB(): DbData {
  return {
    users: [],
    clusters: {},
    attendance: {},
    vanLocations: {},
    memberLocations: {},
    reports: [],
  };
}

function normalizeUsers(users: unknown): DbUser[] {
  if (Array.isArray(users)) return users as DbUser[];
  if (users && typeof users === 'object') return Object.values(users) as DbUser[];
  return [];
}

function normalizeDB(input: unknown): DbData {
  const db = (input && typeof input === 'object' ? input : {}) as Partial<DbData>;
  const users = normalizeUsers(db.users);

  users.forEach((user) => {
    if (!user.passwordHash && user.password) {
      user.passwordHash = bcrypt.hashSync(String(user.password), 10);
      delete user.password;
    }
  });

  return {
    users,
    clusters: db.clusters && typeof db.clusters === 'object' && !Array.isArray(db.clusters) ? db.clusters : {},
    attendance: db.attendance && typeof db.attendance === 'object' && !Array.isArray(db.attendance) ? db.attendance : {},
    vanLocations: db.vanLocations && typeof db.vanLocations === 'object' && !Array.isArray(db.vanLocations) ? db.vanLocations : {},
    memberLocations: db.memberLocations && typeof db.memberLocations === 'object' && !Array.isArray(db.memberLocations) ? db.memberLocations : {},
    reports: Array.isArray(db.reports) ? db.reports : [],
  };
}

function ensureDBExists(): void {
  if (fs.existsSync(DB_PATH)) {
    return;
  }

  if (fs.existsSync(LEGACY_DB_PATH)) {
    const legacyData = JSON.parse(fs.readFileSync(LEGACY_DB_PATH, 'utf-8'));
    fs.writeFileSync(DB_PATH, JSON.stringify(normalizeDB(legacyData), null, 2));
    return;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(createInitialDB(), null, 2));
}

export function readDB(): DbData {
  ensureDBExists();
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return normalizeDB(db);
}

export function writeDB(db: DbData): void {
  ensureDBExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(normalizeDB(db), null, 2));
}
