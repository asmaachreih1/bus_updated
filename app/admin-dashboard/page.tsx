"use client";


import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type DriverStatus = "available" | "on-duty" | "off-duty";
type Shift = "Morning" | "Afternoon" | "Night";
type FeedbackStatus = "new" | "reviewed" | "actioned";
type IncidentSeverity = "low" | "medium" | "high";
type IncidentStatus = "open" | "in-progress" | "resolved";

type Driver = {
  id: string;
  name: string;
  phone: string;
  experienceYears: number;
  safetyScore: number;
  status: DriverStatus;
  assignedBusId: string | null;
  shift: Shift | null;
};

type Bus = {
  id: string;
  plateNumber: string;
  routeName: string;
  capacity: number;
  occupancy: number;
  status: "active" | "maintenance" | "idle";
  driverId: string | null;
};

type Feedback = {
  id: string;
  driverId: string;
  driverName: string;
  rating: number;
  message: string;
  createdAt: string;
  status: FeedbackStatus;
};

type Incident = {
  id: string;
  title: string;
  description: string;
  driverId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
};

type Activity = {
  id: string;
  text: string;
  createdAt: string;
};

type DashboardState = {
  drivers: Driver[];
  buses: Bus[];
  feedbacks: Feedback[];
  incidents: Incident[];
  activities: Activity[];
};

type ApiUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  capacity?: number;
  createdAt?: string;
  phone?: string;
};

type ApiVan = {
  id: string;
  lat?: number;
  lng?: number;
  occupancy?: number;
  isDriving?: boolean;
  lastUpdated?: string;
};

type ApiMember = {
  id: string;
  lat?: number;
  lng?: number;
  name?: string;
  arrived?: boolean;
  lastUpdated?: string;
};

type ApiReport = {
  id: string;
  userId: string;
  userName?: string;
  type?: string;
  message?: string;
  timestamp?: string;
  status?: string;
};

type AttendanceMap = Record<string, string>;

const EMPTY_DASHBOARD: DashboardState = {
  drivers: [],
  buses: [],
  feedbacks: [],
  incidents: [],
  activities: [],
};

function normalizeDate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return new Date(0).toISOString();
}

function getFeedbackStatus(status: string | undefined): FeedbackStatus {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "resolved" || normalized === "actioned") return "actioned";
  if (normalized === "reviewed") return "reviewed";
  return "new";
}

function getIncidentStatus(status: string | undefined): IncidentStatus {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "in-progress") return "in-progress";
  return "open";
}

function getIncidentSeverity(type: string | undefined): IncidentSeverity {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("safety") || normalized.includes("accident")) return "high";
  if (normalized.includes("delay") || normalized.includes("missed")) return "medium";
  return "low";
}

function getShiftFromAttendance(attendanceStatus: string | undefined): Shift | null {
  const normalized = String(attendanceStatus || "").toLowerCase();
  if (normalized.includes("morning")) return "Morning";
  if (normalized.includes("afternoon")) return "Afternoon";
  if (normalized.includes("night")) return "Night";
  return null;
}

function getDriverStatus(attendanceStatus: string | undefined, hasActiveBus: boolean): DriverStatus {
  const normalized = String(attendanceStatus || "").toLowerCase();
  if (normalized.includes("off")) return "off-duty";
  if (normalized.includes("on") || normalized.includes("drive") || normalized.includes("present")) return "on-duty";
  if (normalized.includes("available") || normalized.includes("ready")) return "available";
  return hasActiveBus ? "on-duty" : "available";
}

function getExperienceYears(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const years = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.max(0, Math.floor(years));
}

function getSafetyScore(userId: string, reports: ApiReport[]): number {
  const userReports = reports.filter((report) => String(report.userId) === userId);
  const unresolved = userReports.filter((report) => String(report.status || "").toLowerCase() !== "resolved").length;
  return Math.max(60, 100 - unresolved * 8);
}

function buildDashboardState(
  users: ApiUser[],
  vans: ApiVan[],
  members: ApiMember[],
  reports: ApiReport[],
  attendance: AttendanceMap,
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

  const buses: Bus[] = vans.map((van) => {
    const vanId = String(van.id);
    const linkedDriver = rosterUsers.find((driver) => String(driver.id) === vanId);
    const capacity = Math.max(0, Number(linkedDriver?.capacity || 14));
    return {
      id: vanId,
      plateNumber: `ID-${vanId.slice(0, 6).toUpperCase()}`,
      routeName: `Live Bus ${vanId.slice(0, 6).toUpperCase()}`,
      capacity,
      occupancy: Math.max(0, Number(van.occupancy || 0)),
      status: van.isDriving ? "active" : "idle",
      driverId: linkedDriver ? vanId : null,
    };
  });

  const activeBusByDriverId = new Map(
    buses.filter((bus) => bus.driverId).map((bus) => [String(bus.driverId), bus]),
  );

  const drivers: Driver[] = rosterUsers.map((user) => {
    const userId = String(user.id);
    const activeBus = activeBusByDriverId.get(userId);
    const attendanceStatus = attendance[userId];
    return {
      id: userId,
      name: user.name || user.email || userId,
      phone: user.phone || "N/A",
      experienceYears: getExperienceYears(user.createdAt),
      safetyScore: getSafetyScore(userId, reports),
      status: getDriverStatus(attendanceStatus, Boolean(activeBus)),
      assignedBusId: activeBus?.id || null,
      shift: getShiftFromAttendance(attendanceStatus),
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

  return { drivers, buses, feedbacks, incidents, activities };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextActivityId(activities: Activity[]): string {
  const latestId = activities[0]?.id ?? "ACT-0";
  const latestNumericPart = Number(latestId.split("-")[1]);
  const nextNumber = Number.isFinite(latestNumericPart) ? latestNumericPart + 1 : activities.length + 1;
  return `ACT-${nextNumber}`;
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardState>(EMPTY_DASHBOARD);
  const [assignmentDriverId, setAssignmentDriverId] = useState("");
  const [assignmentBusId, setAssignmentBusId] = useState("");
  const [assignmentShift, setAssignmentShift] = useState<Shift>("Morning");
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | "all">("all");
  const [driverSearch, setDriverSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const loadLiveDashboard = useCallback(async (showRefreshToast = false): Promise<void> => {
    try {
      setIsLoading(true);
      setLoadError("");

      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      const userHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [usersRes, vansRes, reportsRes, attendanceRes] = await Promise.all([
        token ? fetch(`${apiUrl}/api/users`, { headers: userHeaders }) : Promise.resolve(null),
        fetch(`${apiUrl}/api/bus/vans`),
        fetch(`${apiUrl}/api/bus/reports`),
        fetch(`${apiUrl}/api/bus/attendance`),
      ]);

      if (usersRes && !usersRes.ok && usersRes.status !== 401) {
        throw new Error("Failed to load users.");
      }
      if (!vansRes.ok) throw new Error("Failed to load vans.");
      if (!reportsRes.ok) throw new Error("Failed to load reports.");
      if (!attendanceRes.ok) throw new Error("Failed to load attendance.");

      const usersPayload = usersRes ? await usersRes.json() : { users: [] };
      const vansPayload = await vansRes.json();
      const reportsPayload = await reportsRes.json();
      const attendancePayload = await attendanceRes.json();

      const users = Array.isArray(usersPayload?.users) ? (usersPayload.users as ApiUser[]) : [];
      const vans = Array.isArray(vansPayload?.vans) ? (vansPayload.vans as ApiVan[]) : [];
      const members = Array.isArray(vansPayload?.members) ? (vansPayload.members as ApiMember[]) : [];
      const reports = Array.isArray(reportsPayload) ? (reportsPayload as ApiReport[]) : [];
      const attendance =
        attendancePayload && typeof attendancePayload === "object"
          ? (attendancePayload as AttendanceMap)
          : {};

      setDashboard(buildDashboardState(users, vans, members, reports, attendance));

      if (usersRes?.status === 401) {
        setLoadError("Login required to load the complete user list.");
      } else if (showRefreshToast) {
        setMessage("Dashboard synced with live backend data.");
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load live admin data.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    void loadLiveDashboard();
  }, [loadLiveDashboard]);

  const driversById = useMemo(() => {
    const map = new Map<string, Driver>();
    dashboard.drivers.forEach((driver) => map.set(driver.id, driver));
    return map;
  }, [dashboard.drivers]);

  const stats = useMemo(() => {
    const onDuty = dashboard.drivers.filter((driver) => driver.status === "on-duty").length;
    const busesWithoutDriver = dashboard.buses.filter((bus) => !bus.driverId && bus.status !== "maintenance").length;
    const openIncidents = dashboard.incidents.filter((incident) => incident.status !== "resolved").length;
    const avgFeedback =
      dashboard.feedbacks.length > 0
        ? dashboard.feedbacks.reduce((sum, item) => sum + item.rating, 0) / dashboard.feedbacks.length
        : 0;
    return { onDuty, busesWithoutDriver, openIncidents, avgFeedback };
  }, [dashboard]);

  const filteredDrivers = useMemo(() => {
    const query = driverSearch.trim().toLowerCase();
    if (!query) {
      return dashboard.drivers;
    }
    return dashboard.drivers.filter((driver) => {
      return (
        driver.name.toLowerCase().includes(query) ||
        driver.id.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query)
      );
    });
  }, [dashboard.drivers, driverSearch]);

  const filteredFeedbacks = useMemo(() => {
    if (feedbackFilter === "all") {
      return dashboard.feedbacks;
    }
    return dashboard.feedbacks.filter((item) => item.status === feedbackFilter);
  }, [dashboard.feedbacks, feedbackFilter]);

  const availableDrivers = useMemo(() => {
    return dashboard.drivers.filter((driver) => driver.status !== "off-duty");
  }, [dashboard.drivers]);

  const assignableBuses = useMemo(() => {
    return dashboard.buses.filter((bus) => bus.status !== "maintenance");
  }, [dashboard.buses]);

  const fleetReadiness = useMemo(() => {
    const operational = dashboard.buses.filter((bus) => bus.status !== "maintenance");
    if (operational.length === 0) {
      return 0;
    }
    const active = operational.filter((bus) => bus.status === "active").length;
    return Math.round((active / operational.length) * 100);
  }, [dashboard.buses]);

  const occupancyLoad = useMemo(() => {
    const activeBuses = dashboard.buses.filter((bus) => bus.status === "active");
    if (activeBuses.length === 0) {
      return 0;
    }
    const totalPercent = activeBuses.reduce((sum, bus) => {
      return sum + (bus.occupancy / Math.max(bus.capacity, 1)) * 100;
    }, 0);
    return Math.round(totalPercent / activeBuses.length);
  }, [dashboard.buses]);

  function pushActivity(text: string): void {
    setDashboard((prev) => {
      const entry: Activity = {
        id: getNextActivityId(prev.activities),
        text,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        activities: [entry, ...prev.activities].slice(0, 30),
      };
    });
  }

  function handleAssignDriver(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!assignmentDriverId || !assignmentBusId) {
      setMessage("Select both a driver and bus before assigning.");
      return;
    }

    const driver = dashboard.drivers.find((item) => item.id === assignmentDriverId);
    const bus = dashboard.buses.find((item) => item.id === assignmentBusId);

    if (!driver || !bus) {
      setMessage("Unable to assign: driver or bus was not found.");
      return;
    }

    if (driver.status === "off-duty") {
      setMessage("This driver is off-duty. Set them to available first.");
      return;
    }

    setDashboard((prev) => {
      const currentBusForDriver = prev.buses.find((item) => item.driverId === driver.id);
      const currentDriverForBus = prev.drivers.find((item) => item.id === bus.driverId);

      const nextDrivers = prev.drivers.map((item) => {
        if (item.id === driver.id) {
          return {
            ...item,
            assignedBusId: bus.id,
            shift: assignmentShift,
            status: "on-duty" as DriverStatus,
          };
        }
        if (currentDriverForBus && item.id === currentDriverForBus.id && item.id !== driver.id) {
          return {
            ...item,
            assignedBusId: null,
            shift: null,
            status: "available" as DriverStatus,
          };
        }
        if (currentBusForDriver && item.id === driver.id && currentBusForDriver.id !== bus.id) {
          return { ...item, assignedBusId: bus.id };
        }
        return item;
      });

      const nextBuses = prev.buses.map((item) => {
        if (item.id === bus.id) {
          return { ...item, driverId: driver.id, status: "active" as Bus["status"] };
        }
        if (item.driverId === driver.id && item.id !== bus.id) {
          return { ...item, driverId: null, status: "idle" as Bus["status"] };
        }
        return item;
      });

      return { ...prev, drivers: nextDrivers, buses: nextBuses };
    });

    pushActivity(`Assigned ${driver.name} (${driver.id}) to ${bus.routeName} (${bus.id}) for ${assignmentShift} shift.`);
    setMessage(`Assigned ${driver.name} to ${bus.routeName}.`);
  }

  function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): void {
    setDashboard((prev) => ({
      ...prev,
      feedbacks: prev.feedbacks.map((item) => (item.id === feedbackId ? { ...item, status } : item)),
    }));

    if (status === "actioned") {
      void fetch(`${apiUrl}/api/bus/reports/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: feedbackId }),
      }).then(() => {
        setDashboard((prev) => ({
          ...prev,
          incidents: prev.incidents.map((item) =>
            item.id === feedbackId ? { ...item, status: "resolved" } : item,
          ),
        }));
      });
    }

    pushActivity(`Feedback ${feedbackId} marked as ${status}.`);
  }

  function updateDriverStatus(driverId: string, status: DriverStatus): void {
    void fetch(`${apiUrl}/api/bus/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: driverId, status }),
    });

    setDashboard((prev) => ({
      ...prev,
      drivers: prev.drivers.map((item) => {
        if (item.id !== driverId) {
          return item;
        }
        if (status === "off-duty") {
          return { ...item, status, assignedBusId: null, shift: null };
        }
        return { ...item, status };
      }),
      buses:
        status === "off-duty"
          ? prev.buses.map((bus) => (bus.driverId === driverId ? { ...bus, driverId: null, status: "idle" } : bus))
          : prev.buses,
    }));

    const driver = driversById.get(driverId);
    pushActivity(`Driver ${driver ? driver.name : driverId} status set to ${status}.`);
  }

  function updateIncidentStatus(incidentId: string, status: IncidentStatus): void {
    if (status === "resolved") {
      void fetch(`${apiUrl}/api/bus/reports/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: incidentId }),
      });
    }

    setDashboard((prev) => ({
      ...prev,
      incidents: prev.incidents.map((item) => (item.id === incidentId ? { ...item, status } : item)),
    }));
    pushActivity(`Incident ${incidentId} updated to ${status}.`);
  }

  function resetDashboard(): void {
    void loadLiveDashboard(true);
    setAssignmentDriverId("");
    setAssignmentBusId("");
    setFeedbackFilter("all");
    setDriverSearch("");
  }

  return (
    <main className="admin-shell">
      <div className="road-grid" />
      <div className="admin-bg-shape admin-bg-shape-one" />
      <div className="admin-bg-shape admin-bg-shape-two" />

      <section className="admin-header">
        <div>
          <p className="eyebrow">Transit Command Deck</p>
          <h1>Driver Operations Hub</h1>
          <p className="subtitle">Coordinate drivers, route safety, and fleet readiness from one cockpit view.</p>
          <div className="chip-row">
            <span className="chip">Dispatch Live</span>
            <span className="chip">Route Sync</span>
            <span className="chip">Safety Watch</span>
          </div>
        </div>
        <div className="header-metrics">
          <div className="metric-chip">
            <span>Fleet readiness</span>
            <strong>{fleetReadiness}%</strong>
          </div>
          <div className="metric-chip">
            <span>Average load</span>
            <strong>{occupancyLoad}%</strong>
          </div>
          <button type="button" className="ghost-btn" onClick={resetDashboard}>
            Sync Live Data
          </button>
        </div>
      </section>

      {isLoading ? (
        <section className="panel">
          <h2>Loading Live Admin Data</h2>
          <p className="muted">Fetching users, fleet state, reports, and attendance from backend.</p>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="stat-card">
          <p>Active Operators</p>
          <strong>{stats.onDuty}</strong>
          <span>drivers currently on route</span>
        </article>
        <article className="stat-card">
          <p>Unassigned Buses</p>
          <strong>{stats.busesWithoutDriver}</strong>
          <span>vehicles waiting for crew</span>
        </article>
        <article className="stat-card">
          <p>Open Incidents</p>
          <strong>{stats.openIncidents}</strong>
          <span>safety issues to resolve</span>
        </article>
        <article className="stat-card">
          <p>Fleet Occupancy</p>
          <strong>{occupancyLoad}%</strong>
          <span>average load on active routes</span>
        </article>
      </section>

      {loadError ? <p className="message-banner">{loadError}</p> : null}
      {message ? <p className="message-banner">{message}</p> : null}

      <section className="admin-grid">
        <article className="panel">
          <h2>Dispatch Assignment Console</h2>
          <form onSubmit={handleAssignDriver} className="form-grid">
            <label>
              Driver Lane
              <select value={assignmentDriverId} onChange={(event) => setAssignmentDriverId(event.target.value)}>
                <option value="">Select driver</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.id}) - {driver.status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Bus Lane
              <select value={assignmentBusId} onChange={(event) => setAssignmentBusId(event.target.value)}>
                <option value="">Select bus</option>
                {assignableBuses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.routeName} ({bus.id}) - {bus.plateNumber}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Shift Clock
              <select
                value={assignmentShift}
                onChange={(event) => setAssignmentShift(event.target.value as Shift)}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </label>

            <button type="submit" className="primary-btn">
              Dispatch Driver
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Driver Roster</h2>
            <input
              type="text"
              placeholder="Search name, phone, or ID"
              value={driverSearch}
              onChange={(event) => setDriverSearch(event.target.value)}
            />
          </div>

          <div className="list">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="list-item">
                <div>
                  <h3>
                    {driver.name} <span>{driver.id}</span>
                  </h3>
                  <p className="muted">{driver.phone}</p>
                  <p>
                    Safety Score: {driver.safetyScore}% | Experience: {driver.experienceYears}y
                  </p>
                  <div className="meta-row">
                    <span className={`status-pill driver-${driver.status}`}>{driver.status}</span>
                    <span>
                      Assigned: {driver.assignedBusId ? driver.assignedBusId : "Not assigned"}{" "}
                      {driver.shift ? `(${driver.shift})` : ""}
                    </span>
                  </div>
                </div>

                <div className="button-row">
                  <button type="button" className="mini-btn mini-btn-ready" onClick={() => updateDriverStatus(driver.id, "available")}>
                    Available
                  </button>
                  <button type="button" className="mini-btn mini-btn-route" onClick={() => updateDriverStatus(driver.id, "on-duty")}>
                    On Route
                  </button>
                  <button type="button" className="mini-btn mini-btn-off" onClick={() => updateDriverStatus(driver.id, "off-duty")}>
                    Off Duty
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Passenger Feedback</h2>
            <select
              value={feedbackFilter}
              onChange={(event) => setFeedbackFilter(event.target.value as FeedbackStatus | "all")}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="actioned">Actioned</option>
            </select>
          </div>

          <div className="list">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="list-item">
                <div>
                  <h3>
                    {feedback.driverName} <span>{feedback.driverId}</span>
                  </h3>
                  <div className="meta-row">
                    <span className="stars">{`${"★".repeat(feedback.rating)}${"☆".repeat(5 - feedback.rating)}`}</span>
                    <span className={`status-pill feedback-${feedback.status}`}>{feedback.status}</span>
                  </div>
                  <p>{feedback.message}</p>
                  <p className="muted">Submitted: {formatDate(feedback.createdAt)}</p>
                </div>
                <div className="button-row">
                  <button type="button" className="mini-btn mini-btn-route" onClick={() => updateFeedbackStatus(feedback.id, "reviewed")}>
                    Review
                  </button>
                  <button type="button" className="mini-btn mini-btn-ready" onClick={() => updateFeedbackStatus(feedback.id, "actioned")}>
                    Actioned
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Incident Queue</h2>
          <div className="list">
            {dashboard.incidents.map((incident) => {
              const driver = driversById.get(incident.driverId);
              return (
                <div key={incident.id} className="list-item">
                  <div>
                    <h3>
                      {incident.title} <span>{incident.id}</span>
                    </h3>
                    <div className="meta-row">
                      <span className={`status-pill severity-${incident.severity}`}>severity {incident.severity}</span>
                      <span className={`status-pill incident-${incident.status}`}>{incident.status}</span>
                    </div>
                    <p>{incident.description}</p>
                    <p className="muted">Driver: {driver ? driver.name : incident.driverId}</p>
                    <p className="muted">Reported: {formatDate(incident.reportedAt)}</p>
                  </div>
                  <div className="button-row">
                    <button type="button" className="mini-btn mini-btn-route" onClick={() => updateIncidentStatus(incident.id, "in-progress")}>
                      In Progress
                    </button>
                    <button type="button" className="mini-btn mini-btn-ready" onClick={() => updateIncidentStatus(incident.id, "resolved")}>
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>Recent Admin Activity</h2>
        <div className="activity-list">
          {dashboard.activities.map((entry) => (
            <div key={entry.id} className="activity-item">
              <span className="activity-dot" />
              <p>{entry.text}</p>
              <span className="activity-time">{formatDate(entry.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .admin-shell {
          --ink: #e7f3fc;
          --muted: #9eb7ca;
          --line: #365269;
          --panel: rgba(16, 35, 52, 0.87);
          --panel-strong: rgba(10, 24, 37, 0.94);
          --accent: #f2b54a;
          --accent-secondary: #39c4bf;
          --ok: #4fcb96;
          --warning: #f2a64f;
          --danger: #ea6a67;
          position: relative;
          min-height: 100vh;
          padding: 1.25rem;
          color: var(--ink);
          overflow: hidden;
          font-family: "Rajdhani", "Franklin Gothic Medium", "Trebuchet MS", sans-serif;
          background:
            radial-gradient(circle at 15% -8%, rgba(57, 196, 191, 0.24), transparent 42%),
            radial-gradient(circle at 98% 1%, rgba(242, 181, 74, 0.2), transparent 34%),
            linear-gradient(155deg, #06121d 0%, #0b2031 52%, #07131e 100%);
        }

        .road-grid {
          position: absolute;
          top: -12%;
          left: 50%;
          transform: translateX(-50%) rotate(6deg);
          width: 240px;
          height: 130%;
          border-radius: 999px;
          border: 1px solid rgba(97, 134, 159, 0.28);
          background: linear-gradient(180deg, rgba(18, 38, 56, 0.46), rgba(7, 17, 27, 0.2));
          pointer-events: none;
          opacity: 0.58;
          overflow: hidden;
        }

        .road-grid::before {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 9px;
          height: 140%;
          background: repeating-linear-gradient(
            to bottom,
            rgba(242, 181, 74, 0.9) 0 44px,
            transparent 44px 100px
          );
          opacity: 0.84;
          animation: lane-flow 3s linear infinite;
        }

        .admin-bg-shape {
          position: absolute;
          z-index: 0;
          border-radius: 999px;
          filter: blur(40px);
          opacity: 0.35;
          pointer-events: none;
        }

        .admin-bg-shape-one {
          width: 380px;
          height: 380px;
          background: #2dc4c8;
          top: -120px;
          right: -120px;
        }

        .admin-bg-shape-two {
          width: 280px;
          height: 280px;
          background: #f2b54a;
          left: -100px;
          bottom: -120px;
        }

        .admin-header,
        .stats-grid,
        .admin-grid,
        .panel,
        .message-banner {
          position: relative;
          z-index: 1;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          margin: 0 auto 1.25rem auto;
          max-width: 1260px;
        }

        .eyebrow {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent);
        }

        h1 {
          margin: 0.25rem 0 0.35rem 0;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .subtitle {
          margin: 0;
          max-width: 620px;
          color: #b6ccdb;
        }

        .chip-row {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(104, 140, 162, 0.46);
          border-radius: 999px;
          background: rgba(8, 19, 30, 0.6);
          padding: 0.25rem 0.62rem;
          color: #c4d9e7;
          font-size: 0.76rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .header-metrics {
          min-width: min(340px, 100%);
          display: grid;
          gap: 0.45rem;
          align-content: start;
        }

        .metric-chip {
          border: 1px solid rgba(100, 137, 160, 0.44);
          border-radius: 12px;
          background: rgba(6, 18, 28, 0.64);
          padding: 0.5rem 0.65rem;
          display: grid;
          gap: 0.2rem;
        }

        .metric-chip span {
          color: var(--muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .metric-chip strong {
          color: #edf6fc;
          font-size: 1.45rem;
          line-height: 1;
        }

        h2 {
          margin: 0 0 0.75rem 0;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stats-grid {
          max-width: 1260px;
          margin: 0 auto 1rem auto;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .stat-card {
          background: linear-gradient(160deg, var(--panel), var(--panel-strong));
          border: 1px solid rgba(96, 131, 153, 0.42);
          border-left: 3px solid var(--accent-secondary);
          border-radius: 14px;
          padding: 0.9rem 1rem;
          box-shadow: 0 14px 30px rgba(3, 12, 19, 0.4);
        }

        .stat-card:nth-child(2) {
          border-left-color: var(--accent);
        }

        .stat-card:nth-child(3) {
          border-left-color: var(--danger);
        }

        .stat-card:nth-child(4) {
          border-left-color: var(--ok);
        }

        .stat-card p {
          margin: 0;
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.11em;
        }

        .stat-card strong {
          display: block;
          margin-top: 0.24rem;
          font-size: 1.65rem;
          color: #f2f9ff;
        }

        .stat-card span {
          display: block;
          margin-top: 0.22rem;
          font-size: 0.75rem;
          color: #adc3d1;
        }

        .message-banner {
          max-width: 1260px;
          margin: 0 auto 0.9rem auto;
          padding: 0.75rem 0.95rem;
          background: linear-gradient(120deg, rgba(41, 118, 159, 0.42), rgba(16, 48, 67, 0.72));
          border: 1px solid rgba(88, 143, 172, 0.62);
          border-radius: 12px;
          color: #e9f5ff;
        }

        .admin-grid {
          max-width: 1260px;
          margin: 0 auto 1rem auto;
          display: grid;
          gap: 0.8rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .panel {
          max-width: 1260px;
          margin: 0 auto 1rem auto;
          background: linear-gradient(160deg, var(--panel), var(--panel-strong));
          border-radius: 16px;
          border: 1px solid rgba(96, 131, 153, 0.4);
          box-shadow: 0 15px 36px rgba(3, 12, 19, 0.4);
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .form-grid {
          display: grid;
          gap: 0.8rem;
        }

        label {
          font-size: 0.76rem;
          color: #adc2d1;
          display: grid;
          gap: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        input,
        select {
          border: 1px solid rgba(108, 145, 168, 0.44);
          border-radius: 10px;
          padding: 0.55rem 0.65rem;
          background: rgba(8, 20, 30, 0.65);
          color: #e7f3fb;
          font-family: inherit;
        }

        input::placeholder {
          color: #7894a7;
        }

        .list {
          display: grid;
          gap: 0.65rem;
        }

        .list-item {
          border: 1px solid rgba(102, 140, 163, 0.42);
          border-radius: 12px;
          background: rgba(8, 22, 34, 0.66);
          padding: 0.7rem;
          display: flex;
          gap: 0.7rem;
          justify-content: space-between;
          align-items: flex-start;
        }

        .list-item h3 {
          margin: 0 0 0.3rem 0;
          font-size: 0.95rem;
        }

        .list-item h3 span {
          font-size: 0.72rem;
          color: #8eb1c8;
          margin-left: 0.35rem;
          font-weight: 600;
        }

        .list-item p {
          margin: 0.2rem 0;
          font-size: 0.83rem;
          color: #c0d6e4;
        }

        .muted {
          color: #8ea8bb;
          font-size: 0.76rem;
        }

        .meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.2rem;
          font-size: 0.75rem;
          color: #bdd1de;
        }

        .stars {
          color: var(--accent);
          letter-spacing: 0.06em;
          font-size: 0.82rem;
        }

        .status-pill {
          border-radius: 999px;
          padding: 0.15rem 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.62rem;
          border: 1px solid rgba(125, 161, 182, 0.48);
          color: #d4e7f3;
          background: rgba(16, 36, 52, 0.68);
        }

        .driver-available {
          border-color: rgba(79, 203, 150, 0.74);
          color: #9de9c3;
        }

        .driver-on-duty {
          border-color: rgba(57, 196, 191, 0.75);
          color: #9be5e2;
        }

        .driver-off-duty {
          border-color: rgba(149, 169, 183, 0.68);
          color: #becfdb;
        }

        .feedback-new {
          border-color: rgba(242, 166, 79, 0.82);
          color: #ffd59c;
        }

        .feedback-reviewed {
          border-color: rgba(86, 169, 227, 0.76);
          color: #bae4ff;
        }

        .feedback-actioned {
          border-color: rgba(79, 203, 150, 0.74);
          color: #a6ecc8;
        }

        .severity-low {
          border-color: rgba(91, 204, 141, 0.76);
          color: #abedc3;
        }

        .severity-medium {
          border-color: rgba(242, 181, 74, 0.84);
          color: #ffdea4;
        }

        .severity-high {
          border-color: rgba(234, 106, 103, 0.84);
          color: #ffc2bd;
        }

        .incident-open {
          border-color: rgba(234, 106, 103, 0.84);
          color: #ffbfba;
        }

        .incident-in-progress {
          border-color: rgba(242, 181, 74, 0.84);
          color: #ffe1ad;
        }

        .incident-resolved {
          border-color: rgba(79, 203, 150, 0.78);
          color: #a5ebc6;
        }

        .button-row {
          display: grid;
          gap: 0.35rem;
          min-width: 108px;
        }

        button {
          cursor: pointer;
          border: 1px solid rgba(112, 148, 170, 0.56);
          border-radius: 10px;
          padding: 0.45rem 0.6rem;
          background: rgba(10, 26, 40, 0.7);
          color: #dbf0ff;
          font-size: 0.74rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: transform 0.16s ease, border-color 0.16s ease;
        }

        button:hover {
          transform: translateY(-1px);
          border-color: rgba(158, 199, 224, 0.82);
        }

        .primary-btn {
          border: 1px solid rgba(242, 181, 74, 0.82);
          background: linear-gradient(120deg, rgba(242, 181, 74, 0.95), rgba(226, 143, 47, 0.92));
          color: #1d1307;
          font-weight: 700;
        }

        .ghost-btn {
          border: 1px solid rgba(112, 148, 170, 0.56);
          background: rgba(6, 18, 28, 0.82);
          color: #d8e9f5;
          min-width: 150px;
        }

        .mini-btn-ready {
          border-color: rgba(79, 203, 150, 0.74);
          color: #9fe8c2;
        }

        .mini-btn-route {
          border-color: rgba(57, 196, 191, 0.76);
          color: #9ae4e1;
        }

        .mini-btn-off {
          border-color: rgba(149, 169, 183, 0.68);
          color: #bfd0dc;
        }

        .activity-list {
          display: grid;
          gap: 0.45rem;
        }

        .activity-item {
          border: 1px dashed rgba(100, 137, 159, 0.54);
          border-radius: 10px;
          padding: 0.55rem 0.65rem;
          display: flex;
          gap: 0.6rem;
          align-items: center;
          background: rgba(8, 21, 33, 0.7);
        }

        .activity-item p {
          margin: 0;
          font-size: 0.85rem;
          color: #cce0ec;
          flex: 1;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(242, 181, 74, 0.18);
          flex-shrink: 0;
        }

        .activity-time {
          font-size: 0.77rem;
          color: #90a8bb;
          white-space: nowrap;
        }

        .panel-headline {
          display: grid;
          gap: 0.2rem;
        }

        @keyframes lane-flow {
          from {
            transform: translate(-50%, -6%);
          }
          to {
            transform: translate(-50%, 6%);
          }
        }

        @media (max-width: 1060px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }

          .admin-header {
            flex-direction: column;
          }

          .header-metrics {
            width: 100%;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .header-metrics .ghost-btn {
            grid-column: 1 / -1;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .admin-shell {
            padding: 0.9rem;
          }

          .road-grid {
            display: none;
          }

          .panel-head {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .header-metrics {
            grid-template-columns: 1fr;
          }

          .list-item {
            flex-direction: column;
          }

          .button-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
