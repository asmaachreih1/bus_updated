export type UserRole = 'user' | 'driver' | 'admin' | string;

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  capacity?: number;
  createdAt?: string;
  passwordHash?: string;
  password?: string;
}

export interface VanLocation {
  id: string;
  lat: number;
  lng: number;
  isDriving: boolean;
  lastUpdated: Date | string;
}

export interface MemberLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  arrived: boolean;
  selectedVanId?: string;
  lastUpdated: Date | string;
}

export interface Cluster {
  id: string;
  name: string;
  driverId: string;
  members: string[];
}

export interface ReportItem {
  id: string;
  userId: string;
  userName: string;
  type: string;
  message: string;
  timestamp: Date | string;
  status: string;
}

export interface DbData {
  users: DbUser[];
  clusters: Record<string, Cluster>;
  attendance: Record<string, Record<string, string>>;
  vanLocations: Record<string, VanLocation>;
  memberLocations: Record<string, MemberLocation>;
  reports: ReportItem[];
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  capacity: number;
  clusterId?: string;
}
