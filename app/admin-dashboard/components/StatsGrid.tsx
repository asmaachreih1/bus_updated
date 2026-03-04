"use client";

import type { DashboardStats } from "../types";

interface StatsGridProps {
  stats: DashboardStats;
  occupancyLoad: number;
}

export function StatsGrid({ stats, occupancyLoad }: StatsGridProps) {
  return (
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
  );
}
