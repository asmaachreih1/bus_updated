"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Activity, Bus, Driver, DriverStatus, FeedbackStatus, IncidentStatus, Shift } from "./types";
import { useLiveDashboard } from "./hooks";
import { Header } from "./components/Header";
import { StatsGrid } from "./components/StatsGrid";
import { DispatchConsole } from "./components/DispatchConsole";
import { DriverRoster } from "./components/DriverRoster";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { IncidentQueue } from "./components/IncidentQueue";
import { ActivityLog } from "./components/ActivityLog";
import { getNextActivityId, parseErrorMessage } from "./utils";
import { styles } from "./styles";

export default function AdminPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { dashboard, isLoading, loadError, loadLiveDashboard } = useLiveDashboard(apiUrl);

  // Form state
  const [assignmentDriverId, setAssignmentDriverId] = useState("");
  const [assignmentBusId, setAssignmentBusId] = useState("");
  const [assignmentShift, setAssignmentShift] = useState<Shift>("Morning");
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | "all">("all");
  const [driverSearch, setDriverSearch] = useState("");
  const [message, setMessage] = useState("");

  // Memoized calculations

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

  // Helpers
  function pushActivity(text: string): void {
    const entry: Activity = {
      id: getNextActivityId(dashboard.activities),
      text,
      createdAt: new Date().toISOString(),
    };
    // This would normally update state, but for simplicity we reload the dashboard
    void loadLiveDashboard({ silent: true });
  }

  function resetDashboard(): void {
    void loadLiveDashboard({ showRefreshToast: true });
    setAssignmentDriverId("");
    setAssignmentBusId("");
    setFeedbackFilter("all");
    setDriverSearch("");
  }

  async function handleAssignDriver(event: FormEvent<HTMLFormElement>): Promise<void> {
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

    try {
      const dispatchRes = await fetch(`${apiUrl}/api/bus/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: driver.id,
          busId: bus.id,
          shift: assignmentShift,
        }),
      });

      if (!dispatchRes.ok) {
        setMessage(await parseErrorMessage(dispatchRes, "Unable to save dispatch assignment."));
        return;
      }

      await loadLiveDashboard({ silent: true });
      pushActivity(
        `Assigned ${driver.name} (${driver.id}) to ${bus.routeName} (${bus.id}) for ${assignmentShift} shift.`,
      );
      setMessage(`Assigned ${driver.name} to ${bus.routeName}.`);
      setAssignmentDriverId("");
      setAssignmentBusId("");
    } catch {
      setMessage("Unable to save dispatch assignment.");
    }
  }

  async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
    try {
      const updateRes = await fetch(`${apiUrl}/api/bus/reports/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: feedbackId, status }),
      });

      if (!updateRes.ok) {
        setMessage(await parseErrorMessage(updateRes, "Unable to update feedback status."));
        return;
      }

      await loadLiveDashboard({ silent: true });
      pushActivity(`Feedback ${feedbackId} marked as ${status}.`);
      setMessage(`Feedback ${feedbackId} updated.`);
    } catch {
      setMessage("Unable to update feedback status.");
    }
  }

  async function updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
    const driver = driversById.get(driverId);
    const attendanceStatus =
      status === "on-duty" && driver?.shift ? `on-duty ${driver.shift}` : status;

    try {
      const attendanceRes = await fetch(`${apiUrl}/api/bus/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: driverId, status: attendanceStatus }),
      });

      if (!attendanceRes.ok) {
        setMessage(await parseErrorMessage(attendanceRes, "Unable to update driver status."));
        return;
      }

      if (status === "off-duty") {
        const clearDispatchRes = await fetch(`${apiUrl}/api/bus/dispatch/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId }),
        });

        if (!clearDispatchRes.ok) {
          setMessage(await parseErrorMessage(clearDispatchRes, "Unable to clear bus assignment."));
          return;
        }
      }

      await loadLiveDashboard({ silent: true });
      pushActivity(`Driver ${driver ? driver.name : driverId} status set to ${status}.`);
      setMessage(`Driver ${driver ? driver.name : driverId} updated to ${status}.`);
    } catch {
      setMessage("Unable to update driver status.");
    }
  }

  async function updateIncidentStatus(incidentId: string, status: IncidentStatus): Promise<void> {
    try {
      const updateRes = await fetch(`${apiUrl}/api/bus/reports/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: incidentId, status }),
      });

      if (!updateRes.ok) {
        setMessage(await parseErrorMessage(updateRes, "Unable to update incident status."));
        return;
      }

      await loadLiveDashboard({ silent: true });
      pushActivity(`Incident ${incidentId} updated to ${status}.`);
      setMessage(`Incident ${incidentId} updated to ${status}.`);
    } catch {
      setMessage("Unable to update incident status.");
    }
  }

  return (
    <main className="admin-shell">
      <div className="road-grid" />
      <div className="admin-bg-shape admin-bg-shape-one" />
      <div className="admin-bg-shape admin-bg-shape-two" />

      <Header fleetReadiness={fleetReadiness} occupancyLoad={occupancyLoad} onSyncClick={resetDashboard} />

      {isLoading ? (
        <section className="panel">
          <h2>Loading Live Admin Data</h2>
          <p className="muted">Fetching users, fleet state, reports, and attendance from backend.</p>
        </section>
      ) : null}

      <StatsGrid stats={stats} occupancyLoad={occupancyLoad} />

      {loadError ? <p className="message-banner">{loadError}</p> : null}
      {message ? <p className="message-banner">{message}</p> : null}

      <section className="admin-grid">
        <DispatchConsole
          availableDrivers={availableDrivers}
          assignableBuses={assignableBuses}
          assignmentDriverId={assignmentDriverId}
          assignmentBusId={assignmentBusId}
          assignmentShift={assignmentShift}
          onDriverChange={setAssignmentDriverId}
          onBusChange={setAssignmentBusId}
          onShiftChange={setAssignmentShift}
          onSubmit={handleAssignDriver}
        />

        <DriverRoster
          drivers={filteredDrivers}
          driverSearch={driverSearch}
          onSearchChange={setDriverSearch}
          onStatusChange={updateDriverStatus}
        />
      </section>

      <section className="admin-grid">
        <FeedbackPanel
          feedbacks={filteredFeedbacks}
          feedbackFilter={feedbackFilter}
          onFilterChange={setFeedbackFilter}
          onStatusChange={updateFeedbackStatus}
        />

        <IncidentQueue
          incidents={dashboard.incidents}
          driversById={driversById}
          onStatusChange={updateIncidentStatus}
        />
      </section>

      <ActivityLog activities={dashboard.activities} />

      <style jsx>{styles}</style>
    </main>
  );
}
