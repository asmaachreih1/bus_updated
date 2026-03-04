"use client";

import type { Activity } from "../types";
import { formatDate } from "../utils";

interface ActivityLogProps {
  activities: Activity[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <section className="panel">
      <h2>Recent Admin Activity</h2>
      <div className="activity-list">
        {activities.map((entry) => (
          <div key={entry.id} className="activity-item">
            <span className="activity-dot" />
            <p>{entry.text}</p>
            <span className="activity-time">{formatDate(entry.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
