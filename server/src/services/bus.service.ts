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

type DispatchPayload = {
  busId?: string;
  driverId?: string;
  shift?: string;
};

type ClearDispatchPayload = {
  busId?: string;
  driverId?: string;
};

type UpdateReportStatusPayload = {
  reportId?: string;
  status?: string;
};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeReportStatus(status: unknown): string {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) {
    throw new ServiceError(400, 'status is required');
  }

  if (normalized === 'actioned') {
    return 'resolved';
  }

  return normalized;
}

function normalizeShift(shift: unknown): string {
  const normalized = String(shift || '').trim();
  return normalized || 'Morning';
}

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
  const vanId = String(van_id || '').trim();

  if (!vanId) {
    throw new ServiceError(400, 'van_id is required');
  }

  const existingVan = db.vanLocations[vanId] || {};

  db.vanLocations[vanId] = {
    ...existingVan,
    id: vanId,
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    isDriving: !!isDriving,
    lastUpdated: new Date().toISOString(),
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
  const today = getTodayKey();

  if (!db.attendance[today]) db.attendance[today] = {};
  db.attendance[today][String(userId)] = String(status || '');

  writeDB(db);
  return { success: true };
}

export function getAttendance() {
  const db = readDB();
  const today = getTodayKey();
  return db.attendance[today] || {};
}

export function getDispatchAssignments() {
  const db = readDB();
  return Object.values(db.dispatchAssignments || {});
}

export function assignDispatch(payload: DispatchPayload) {
  const { busId, driverId, shift } = payload || {};
  const normalizedBusId = String(busId || '').trim();
  const normalizedDriverId = String(driverId || '').trim();
  const normalizedShift = normalizeShift(shift);

  if (!normalizedBusId || !normalizedDriverId) {
    throw new ServiceError(400, 'busId and driverId are required');
  }

  const db = readDB();

  Object.keys(db.dispatchAssignments).forEach((assignedBusId) => {
    const assignment = db.dispatchAssignments[assignedBusId];
    if (String(assignment?.driverId || '') === normalizedDriverId && assignedBusId !== normalizedBusId) {
      delete db.dispatchAssignments[assignedBusId];
    }
  });

  db.dispatchAssignments[normalizedBusId] = {
    busId: normalizedBusId,
    driverId: normalizedDriverId,
    shift: normalizedShift,
    assignedAt: new Date().toISOString(),
  };

  const today = getTodayKey();
  if (!db.attendance[today]) {
    db.attendance[today] = {};
  }
  db.attendance[today][normalizedDriverId] = `on-duty ${normalizedShift}`;

  writeDB(db);
  return { success: true, assignment: db.dispatchAssignments[normalizedBusId] };
}

export function clearDispatch(payload: ClearDispatchPayload) {
  const { busId, driverId } = payload || {};
  const normalizedBusId = String(busId || '').trim();
  const normalizedDriverId = String(driverId || '').trim();

  if (!normalizedBusId && !normalizedDriverId) {
    throw new ServiceError(400, 'busId or driverId is required');
  }

  const db = readDB();
  const removedBusIds = new Set<string>();

  if (normalizedBusId && db.dispatchAssignments[normalizedBusId]) {
    delete db.dispatchAssignments[normalizedBusId];
    removedBusIds.add(normalizedBusId);
  }

  if (normalizedDriverId) {
    Object.keys(db.dispatchAssignments).forEach((assignedBusId) => {
      const assignment = db.dispatchAssignments[assignedBusId];
      if (String(assignment?.driverId || '') === normalizedDriverId) {
        delete db.dispatchAssignments[assignedBusId];
        removedBusIds.add(assignedBusId);
      }
    });
  }

  writeDB(db);
  return { success: true, clearedBusIds: Array.from(removedBusIds) };
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

export function updateReportStatus(payload: UpdateReportStatusPayload) {
  const { reportId, status } = payload || {};
  const normalizedReportId = String(reportId || '').trim();
  const normalizedStatus = normalizeReportStatus(status);

  if (!normalizedReportId) {
    throw new ServiceError(400, 'reportId is required');
  }

  const db = readDB();
  const report = db.reports.find((item) => item.id === normalizedReportId);

  if (!report) {
    throw new ServiceError(404, 'Report not found');
  }

  report.status = normalizedStatus;
  writeDB(db);

  return { success: true, report };
}

export function resolveReport(payload: ResolveReportPayload) {
  const { reportId } = payload || {};
  return updateReportStatus({ reportId, status: 'resolved' });
}

export function resetSimulation() {
  writeDB(createInitialDB());
  return { success: true, message: 'Simulation reset' };
}
