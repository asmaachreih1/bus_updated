import {
  type ApiDispatchAssignment,
  type ApiMember,
  type ApiReport,
  type ApiUser,
  type ApiVan,
  type AttendanceMap,
  type Bus,
  type DashboardState,
  type Driver,
  type Feedback,
  type Incident,
  type Activity,
  type IncidentSeverity,
  type IncidentStatus,
  type FeedbackStatus,
  type Shift,
  type DriverStatus,
} from "./types";

export const EMPTY_DASHBOARD: DashboardState = {
  drivers: [],
  buses: [],
  feedbacks: [],
  incidents: [],
  activities: [],
};

export function normalizeDate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return new Date(0).toISOString();
}

export function getFeedbackStatus(status: string | undefined): FeedbackStatus {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "resolved" || normalized === "actioned") return "actioned";
  if (normalized === "reviewed") return "reviewed";
  return "new";
}

export function getIncidentStatus(status: string | undefined): IncidentStatus {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "in-progress") return "in-progress";
  return "open";
}

export function getIncidentSeverity(type: string | undefined): IncidentSeverity {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("safety") || normalized.includes("accident")) return "high";
  if (normalized.includes("delay") || normalized.includes("missed")) return "medium";
  return "low";
}

export function getShiftFromText(value: string | undefined): Shift | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("morning")) return "Morning";
  if (normalized.includes("afternoon")) return "Afternoon";
  if (normalized.includes("night")) return "Night";
  return null;
}

export function getShiftFromAttendance(attendanceStatus: string | undefined): Shift | null {
  return getShiftFromText(attendanceStatus);
}

export function getDriverStatus(attendanceStatus: string | undefined, hasActiveBus: boolean): DriverStatus {
  const normalized = String(attendanceStatus || "").toLowerCase();
  if (normalized.includes("off")) return "off-duty";
  if (normalized.includes("on") || normalized.includes("drive") || normalized.includes("present")) return "on-duty";
  if (normalized.includes("available") || normalized.includes("ready")) return "available";
  return hasActiveBus ? "on-duty" : "available";
}

export function getExperienceYears(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const years = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.max(0, Math.floor(years));
}

export function getSafetyScore(userId: string, reports: ApiReport[]): number {
  const userReports = reports.filter((report) => String(report.userId) === userId);
  const unresolved = userReports.filter((report) => String(report.status || "").toLowerCase() !== "resolved").length;
  return Math.max(60, 100 - unresolved * 8);
}

export function buildDashboardState(
  users: ApiUser[],
  vans: ApiVan[],
  members: ApiMember[],
  reports: ApiReport[],
  attendance: AttendanceMap,
  dispatchAssignments: ApiDispatchAssignment[],
): DashboardState {
  const usersById = new Map(users.map((user) => [String(user.id), user]));
  const driverUsers = users.some((user) => user.role === "driver")
    ? users.filter((user) => user.role === "driver")
    : users;
  const fallbackUsersFromMembers: ApiUser[] =
    driverUsers.length > 0 || users.length > 0
      ? []
      : members.map((member) => ({
          id: String(member.id),
          name: member.name || String(member.id),
          role: "user",
        }));
  const rosterUsers = driverUsers.length > 0 ? driverUsers : users.length > 0 ? users : fallbackUsersFromMembers;

  const rosterUsersById = new Map(rosterUsers.map((user) => [String(user.id), user]));
  const normalizedAssignments = dispatchAssignments
    .map((assignment) => ({
      busId: String(assignment.busId || "").trim(),
      driverId: String(assignment.driverId || "").trim(),
      shift: String(assignment.shift || "").trim(),
    }))
    .filter((assignment) => assignment.busId && assignment.driverId);

  const assignmentByBusId = new Map(normalizedAssignments.map((assignment) => [assignment.busId, assignment]));
  const assignmentByDriverId = new Map(
    normalizedAssignments.map((assignment) => [assignment.driverId, assignment]),
  );

  const buses: Bus[] = vans.map((van) => {
    const vanId = String(van.id);
    const dispatchAssignment = assignmentByBusId.get(vanId);
    const fallbackDriver = rosterUsersById.get(vanId);
    const linkedDriverId = dispatchAssignment?.driverId || fallbackDriver?.id || null;
    const linkedDriver = linkedDriverId
      ? usersById.get(String(linkedDriverId)) || rosterUsersById.get(String(linkedDriverId))
      : undefined;
    const capacity = Math.max(0, Number(linkedDriver?.capacity || 14));
    return {
      id: vanId,
      plateNumber: `ID-${vanId.slice(0, 6).toUpperCase()}`,
      routeName: `Live Bus ${vanId.slice(0, 6).toUpperCase()}`,
      capacity,
      occupancy: Math.max(0, Number(van.occupancy || 0)),
      status: van.isDriving ? "active" : "idle",
      driverId: linkedDriverId ? String(linkedDriverId) : null,
    };
  });

  const busesById = new Map(buses.map((bus) => [bus.id, bus]));

  normalizedAssignments.forEach((assignment) => {
    const existingBus = busesById.get(assignment.busId);
    if (existingBus) {
      busesById.set(assignment.busId, { ...existingBus, driverId: assignment.driverId });
      return;
    }

    const linkedDriver =
      usersById.get(assignment.driverId) || rosterUsersById.get(assignment.driverId);
    busesById.set(assignment.busId, {
      id: assignment.busId,
      plateNumber: `ID-${assignment.busId.slice(0, 6).toUpperCase()}`,
      routeName: `Assigned Bus ${assignment.busId.slice(0, 6).toUpperCase()}`,
      capacity: Math.max(0, Number(linkedDriver?.capacity || 14)),
      occupancy: 0,
      status: "idle",
      driverId: assignment.driverId,
    });
  });

  const mergedBuses = Array.from(busesById.values());
  const activeBusByDriverId = new Map(
    mergedBuses.filter((bus) => bus.driverId).map((bus) => [String(bus.driverId), bus]),
  );

  const drivers: Driver[] = rosterUsers.map((user) => {
    const userId = String(user.id);
    const assignedBusIdFromDispatch = assignmentByDriverId.get(userId)?.busId || null;
    const activeBus = assignedBusIdFromDispatch
      ? busesById.get(assignedBusIdFromDispatch) || null
      : activeBusByDriverId.get(userId) || null;
    const attendanceStatus = attendance[userId];
    const shift =
      getShiftFromText(assignmentByDriverId.get(userId)?.shift) ||
      getShiftFromAttendance(attendanceStatus);

    return {
      id: userId,
      name: user.name || user.email || userId,
      phone: user.phone || "N/A",
      experienceYears: getExperienceYears(user.createdAt),
      safetyScore: getSafetyScore(userId, reports),
      status: getDriverStatus(attendanceStatus, Boolean(activeBus)),
      assignedBusId: assignedBusIdFromDispatch || activeBus?.id || null,
      shift,
    };
  });

  const feedbacks: Feedback[] = reports.map((report) => {
    const userId = String(report.userId || "");
    const reportUser = usersById.get(userId);
    return {
      id: String(report.id),
      driverId: userId,
      driverName: reportUser?.name || report.userName || userId || "Unknown",
      rating: 0,
      message: report.message || "No message",
      createdAt: normalizeDate(report.timestamp),
      status: getFeedbackStatus(report.status),
    };
  });

  const incidents: Incident[] = reports.map((report) => {
    const reportType = String(report.type || "general");
    return {
      id: String(report.id),
      title: `${reportType.toUpperCase()} report`,
      description: report.message || "No description",
      driverId: String(report.userId || ""),
      severity: getIncidentSeverity(report.type),
      status: getIncidentStatus(report.status),
      reportedAt: normalizeDate(report.timestamp),
    };
  });

  const reportActivities: Activity[] = reports.map((report) => ({
    id: `report-${report.id}`,
    text: `Report from ${report.userName || report.userId || "Unknown"} (${report.type || "general"}).`,
    createdAt: normalizeDate(report.timestamp),
  }));

  const signupActivities: Activity[] = users
    .filter((user) => user.createdAt)
    .map((user) => ({
      id: `user-${user.id}`,
      text: `${user.name || user.email || user.id} joined as ${user.role || "user"}.`,
      createdAt: normalizeDate(user.createdAt),
    }));

  const activities = [...reportActivities, ...signupActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);

  return { drivers, buses: mergedBuses, feedbacks, incidents, activities };
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNextActivityId(activities: Activity[]): string {
  const latestId = activities[0]?.id ?? "ACT-0";
  const latestNumericPart = Number(latestId.split("-")[1]);
  const nextNumber = Number.isFinite(latestNumericPart) ? latestNumericPart + 1 : activities.length + 1;
  return `ACT-${nextNumber}`;
}

export async function parseErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}
