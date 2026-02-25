import { createInitialDB, readDB, writeDB } from '../utils/fileDB';

class ServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type UpdateLocationPayload = {
  van_id?: string;
  lat?: number | string;
  lng?: number | string;
  isDriving?: boolean;
};

type UpdateMemberPayload = {
  id?: string;
  lat?: number | string;
  lng?: number | string;
  name?: string;
  arrived?: boolean;
};

type CreateClusterPayload = {
  name?: string;
  driverId?: string;
};

type JoinClusterPayload = {
  clusterId?: string;
  userId?: string;
};

type AttendancePayload = {
  userId?: string;
  status?: string;
};

type ReportPayload = {
  userId?: string;
  userName?: string;
  type?: string;
  message?: string;
};

type ResolveReportPayload = {
  reportId?: string;
};

export function getVansState() {
  const db = readDB();
  return {
    vans: Object.values(db.vanLocations),
    members: Object.values(db.memberLocations),
  };
}

export function updateLocation(payload: UpdateLocationPayload) {
  const { van_id, lat, lng, isDriving } = payload || {};
  const db = readDB();

  db.vanLocations[String(van_id)] = {
    id: String(van_id),
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    isDriving: !!isDriving,
    lastUpdated: new Date(),
  };

  writeDB(db);
  return { success: true };
}

export function updateMember(payload: UpdateMemberPayload) {
  const { id, lat, lng, name, arrived } = payload || {};
  const memberId = String(id);
  const db = readDB();
  const previouslyArrived = db.memberLocations[memberId]?.arrived || false;

  db.memberLocations[memberId] = {
    id: memberId,
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    name: name || 'Friend',
    arrived: arrived !== undefined ? arrived : previouslyArrived,
    lastUpdated: new Date(),
  };

  writeDB(db);
  return { success: true };
}

export function createCluster(payload: CreateClusterPayload) {
  const { name, driverId } = payload || {};
  const db = readDB();
  const clusterId = Math.random().toString(36).substring(7);

  db.clusters[clusterId] = {
    id: clusterId,
    name: String(name || ''),
    driverId: String(driverId || ''),
    members: [],
  };

  writeDB(db);
  return { success: true, cluster: db.clusters[clusterId] };
}

export function joinCluster(payload: JoinClusterPayload) {
  const { clusterId, userId } = payload || {};
  const db = readDB();
  const targetClusterId = String(clusterId || '');
  const targetUserId = String(userId || '');

  if (!db.clusters[targetClusterId]) {
    throw new ServiceError(404, 'Cluster not found');
  }

  if (!db.clusters[targetClusterId].members.includes(targetUserId)) {
    db.clusters[targetClusterId].members.push(targetUserId);
  }

  writeDB(db);
  return { success: true };
}

export function setAttendance(payload: AttendancePayload) {
  const { userId, status } = payload || {};
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];

  if (!db.attendance[today]) db.attendance[today] = {};
  db.attendance[today][String(userId)] = String(status || '');

  writeDB(db);
  return { success: true };
}

export function getAttendance() {
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];
  return db.attendance[today] || {};
}

export function createReport(payload: ReportPayload) {
  const { userId, userName, type, message } = payload || {};
  const db = readDB();
  const report = {
    id: Math.random().toString(36).substring(7),
    userId: String(userId || ''),
    userName: String(userName || ''),
    type: String(type || ''),
    message: String(message || ''),
    timestamp: new Date(),
    status: 'pending',
  };

  db.reports.push(report);
  writeDB(db);
  return { success: true, report };
}

export function getReports() {
  const db = readDB();
  return db.reports || [];
}

export function resolveReport(payload: ResolveReportPayload) {
  const { reportId } = payload || {};
  const db = readDB();
  const report = db.reports.find((item) => item.id === reportId);

  if (report) {
    report.status = 'resolved';
    writeDB(db);
  }

  return { success: true };
}

export function resetSimulation() {
  writeDB(createInitialDB());
  return { success: true, message: 'Simulation reset' };
}
