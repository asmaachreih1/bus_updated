"use client";

import type { Driver, Incident, IncidentStatus } from "../types";
import { formatDate } from "../utils";

interface IncidentQueueProps {
  incidents: Incident[];
  driversById: Map<string, Driver>;
  onStatusChange: (incidentId: string, status: IncidentStatus) => Promise<void>;
}

export function IncidentQueue({
  incidents,
  driversById,
  onStatusChange,
}: IncidentQueueProps) {
  return (
    <article className="panel">
      <h2>Incident Queue</h2>
      <div className="list">
        {incidents.map((incident) => {
          const driver = driversById.get(incident.driverId);
          return (
            <div key={incident.id} className="list-item">
              <div>
                <h3>
                  {incident.title} <span>{incident.id}</span>
                </h3>
                <div className="meta-row">
                  <span className={`status-pill severity-${incident.severity}`}>
                    severity {incident.severity}
                  </span>
                  <span className={`status-pill incident-${incident.status}`}>
                    {incident.status}
                  </span>
                </div>
                <p>{incident.description}</p>
                <p className="muted">Driver: {driver ? driver.name : incident.driverId}</p>
                <p className="muted">Reported: {formatDate(incident.reportedAt)}</p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="mini-btn mini-btn-route"
                  onClick={() => onStatusChange(incident.id, "in-progress")}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  className="mini-btn mini-btn-ready"
                  onClick={() => onStatusChange(incident.id, "resolved")}
                >
                  Resolve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
