import Location from '../models/Location';
import Cluster from '../models/Cluster';
import Attendance from '../models/Attendance';
import Report from '../models/Report';

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
  destination?: string;
  destLat?: number | string;
  destLng?: number | string;
};

type UpdateMemberPayload = {
  id?: string;
  lat?: number | string;
  lng?: number | string;
  name?: string;
  arrived?: boolean;
  selectedVanId?: string;
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

export async function getVansState() {
  const locations = await Location.find().lean();

  return {
    vans: locations.filter(loc => loc.isDriving || (loc.destination)).map(loc => ({ ...loc, id: loc.user_id })),
    members: locations.filter(loc => !loc.isDriving && !loc.destination).map(loc => ({ ...loc, id: loc.user_id })),
  };
}

export async function updateLocation(payload: UpdateLocationPayload) {
  const { van_id, lat, lng, isDriving, destination, destLat, destLng } = payload || {};

  await Location.findOneAndUpdate(
    { user_id: String(van_id) },
    {
      user_id: String(van_id),
      lat: parseFloat(String(lat)),
      lng: parseFloat(String(lng)),
      isDriving: !!isDriving,
      destination: destination || undefined,
      destLat: destLat ? parseFloat(String(destLat)) : undefined,
      destLng: destLng ? parseFloat(String(destLng)) : undefined,
      updated_at: new Date(),
    },
    { upsert: true }
  );

  return { success: true };
}

export async function updateMember(payload: UpdateMemberPayload) {
  const { id, lat, lng, name, arrived } = payload || {};
  const memberId = String(id);

  await Location.findOneAndUpdate(
    { user_id: memberId },
    {
      user_id: memberId,
      lat: parseFloat(String(lat)),
      lng: parseFloat(String(lng)),
      name: name || 'Friend',
      arrived: !!arrived,
      selectedVanId: payload.selectedVanId,
      updated_at: new Date(),
    },
    { upsert: true }
  );

  return { success: true };
}

export async function createCluster(payload: CreateClusterPayload) {
  const { name, driverId } = payload || {};
  const clusterId = Math.random().toString(36).substring(7);

  const cluster = new Cluster({
    id: clusterId,
    name: String(name || ''),
    driver_id: String(driverId || ''),
    code: clusterId // Using ID as code for simplicity if not provided
  });

  await cluster.save();
  return { success: true, cluster };
}

export async function joinCluster(payload: JoinClusterPayload) {
  const { clusterId, userId } = payload || {};
  const targetClusterId = String(clusterId || '');
  const targetUserId = String(userId || '');

  const cluster = await Cluster.findOne({ id: targetClusterId });
  if (!cluster) {
    throw new ServiceError(404, 'Cluster not found');
  }

  // In this model, members are not an array in Cluster, but we can simulate it if needed
  // or just return success as the frontend might handle the association elsewhere.
  // Actually, Cluster schema had driver_id. User schema has cluster_id.

  const User = (await import('../models/User')).default;
  await User.findOneAndUpdate({ id: targetUserId }, { cluster_id: cluster.code });

  return { success: true };
}

export async function setAttendance(payload: AttendancePayload) {
  const { userId, status } = payload || {};
  const today = new Date().toISOString().split('T')[0];

  await Attendance.findOneAndUpdate(
    { user_id: String(userId), date: today },
    { status: String(status || '') },
    { upsert: true }
  );

  return { success: true };
}

export async function getAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const records = await Attendance.find({ date: today }).lean();

  const result: Record<string, string> = {};
  records.forEach(rec => {
    result[rec.user_id] = rec.status;
  });

  return result;
}

export async function createReport(payload: ReportPayload) {
  const { userId, userName, type, message } = payload || {};

  const report = new Report({
    id: Math.random().toString(36).substring(7),
    user_id: String(userId || ''),
    user_name: String(userName || ''),
    type: String(type || ''),
    message: String(message || ''),
    status: 'pending',
  });

  await report.save();
  return { success: true, report };
}

export async function getReports() {
  return await Report.find().lean();
}

export async function resolveReport(payload: ResolveReportPayload) {
  const { reportId } = payload || {};
  await Report.findOneAndUpdate({ id: reportId }, { status: 'resolved' });
  return { success: true };
}

export async function resetSimulation() {
  await Location.deleteMany({});
  await Cluster.deleteMany({});
  await Attendance.deleteMany({});
  await Report.deleteMany({});
  return { success: true, message: 'Simulation reset' };
}
