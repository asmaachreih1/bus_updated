"use client";

import type { Driver, DriverStatus } from "../types";

interface DriverRosterProps {
  drivers: Driver[];
  driverSearch: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (driverId: string, status: DriverStatus) => Promise<void>;
}

export function DriverRoster({
  drivers,
  driverSearch,
  onSearchChange,
  onStatusChange,
}: DriverRosterProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Driver Roster</h2>
        <input
          type="text"
          placeholder="Search name, phone, or ID"
          value={driverSearch}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="list">
        {drivers.map((driver) => (
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
              <button
                type="button"
                className="mini-btn mini-btn-ready"
                onClick={() => onStatusChange(driver.id, "available")}
              >
                Available
              </button>
              <button
                type="button"
                className="mini-btn mini-btn-route"
                onClick={() => onStatusChange(driver.id, "on-duty")}
              >
                On Route
              </button>
              <button
                type="button"
                className="mini-btn mini-btn-off"
                onClick={() => onStatusChange(driver.id, "off-duty")}
              >
                Off Duty
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
