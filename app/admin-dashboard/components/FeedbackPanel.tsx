"use client";

import type { Feedback, FeedbackStatus } from "../types";
import { formatDate } from "../utils";

interface FeedbackPanelProps {
  feedbacks: Feedback[];
  feedbackFilter: FeedbackStatus | "all";
  onFilterChange: (filter: FeedbackStatus | "all") => void;
  onStatusChange: (feedbackId: string, status: FeedbackStatus) => Promise<void>;
}

export function FeedbackPanel({
  feedbacks,
  feedbackFilter,
  onFilterChange,
  onStatusChange,
}: FeedbackPanelProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Passenger Feedback</h2>
        <select
          value={feedbackFilter}
          onChange={(e) => onFilterChange(e.target.value as FeedbackStatus | "all")}
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="actioned">Actioned</option>
        </select>
      </div>

      <div className="list">
        {feedbacks.map((feedback) => (
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
              <button
                type="button"
                className="mini-btn mini-btn-route"
                onClick={() => onStatusChange(feedback.id, "reviewed")}
              >
                Review
              </button>
              <button
                type="button"
                className="mini-btn mini-btn-ready"
                onClick={() => onStatusChange(feedback.id, "actioned")}
              >
                Actioned
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
