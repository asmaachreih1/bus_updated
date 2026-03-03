"use client";

interface HeaderProps {
  fleetReadiness: number;
  occupancyLoad: number;
  onSyncClick: () => void;
}

export function Header({ fleetReadiness, occupancyLoad, onSyncClick }: HeaderProps) {
  return (
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
        <button type="button" className="ghost-btn" onClick={onSyncClick}>
          Sync Live Data
        </button>
      </div>
    </section>
  );
}
