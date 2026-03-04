"use client";

import { FormEvent } from "react";
import type { Bus, Driver, Shift } from "../types";

interface DispatchConsoleProps {
  availableDrivers: Driver[];
  assignableBuses: Bus[];
  assignmentDriverId: string;
  assignmentBusId: string;
  assignmentShift: Shift;
  onDriverChange: (id: string) => void;
  onBusChange: (id: string) => void;
  onShiftChange: (shift: Shift) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function DispatchConsole({
  availableDrivers,
  assignableBuses,
  assignmentDriverId,
  assignmentBusId,
  assignmentShift,
  onDriverChange,
  onBusChange,
  onShiftChange,
  onSubmit,
}: DispatchConsoleProps) {
  return (
    <article className="panel">
      <h2>Dispatch Assignment Console</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Driver Lane
          <select value={assignmentDriverId} onChange={(e) => onDriverChange(e.target.value)}>
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
          <select value={assignmentBusId} onChange={(e) => onBusChange(e.target.value)}>
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
            onChange={(e) => onShiftChange(e.target.value as Shift)}
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
  );
}
