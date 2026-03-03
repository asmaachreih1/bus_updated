"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type ApiDispatchAssignment,
  type ApiMember,
  type ApiReport,
  type ApiUser,
  type ApiVan,
  type AttendanceMap,
  type DashboardState,
} from "./types";
import {
  EMPTY_DASHBOARD,
  buildDashboardState,
  parseErrorMessage,
} from "./utils";

interface UseLiveDashboardOptions {
  showRefreshToast?: boolean;
  silent?: boolean;
}

interface UseLiveDashboardReturn {
  dashboard: DashboardState;
  isLoading: boolean;
  loadError: string;
  loadLiveDashboard: (options?: UseLiveDashboardOptions) => Promise<void>;
}

export function useLiveDashboard(apiUrl: string): UseLiveDashboardReturn {
  const [dashboard, setDashboard] = useState<DashboardState>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadLiveDashboard = useCallback(
    async (options?: UseLiveDashboardOptions): Promise<void> => {
      const showRefreshToast = options?.showRefreshToast ?? false;
      const silent = options?.silent ?? false;

      try {
        if (!silent) {
          setIsLoading(true);
        }
        setLoadError("");

        const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
        const userHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [usersRes, vansRes, reportsRes, attendanceRes, dispatchRes] = await Promise.all([
          token ? fetch(`${apiUrl}/api/users`, { headers: userHeaders }) : Promise.resolve(null),
          fetch(`${apiUrl}/api/bus/vans`),
          fetch(`${apiUrl}/api/bus/reports`),
          fetch(`${apiUrl}/api/bus/attendance`),
          fetch(`${apiUrl}/api/bus/dispatch`),
        ]);

        if (usersRes && !usersRes.ok && usersRes.status !== 401) {
          throw new Error("Failed to load users.");
        }
        if (!vansRes.ok) throw new Error("Failed to load vans.");
        if (!reportsRes.ok) throw new Error("Failed to load reports.");
        if (!attendanceRes.ok) throw new Error("Failed to load attendance.");
        if (!dispatchRes.ok) throw new Error("Failed to load assignments.");

        const [usersPayload, vansPayload, reportsPayload, attendancePayload, dispatchPayload] =
          await Promise.all([
            usersRes ? usersRes.json() : Promise.resolve({ users: [] }),
            vansRes.json(),
            reportsRes.json(),
            attendanceRes.json(),
            dispatchRes.json(),
          ]);

        const users = Array.isArray(usersPayload?.users) ? (usersPayload.users as ApiUser[]) : [];
        const vans = Array.isArray(vansPayload?.vans) ? (vansPayload.vans as ApiVan[]) : [];
        const members = Array.isArray(vansPayload?.members) ? (vansPayload.members as ApiMember[]) : [];
        const reports = Array.isArray(reportsPayload) ? (reportsPayload as ApiReport[]) : [];
        const dispatchAssignments = Array.isArray(dispatchPayload?.assignments)
          ? (dispatchPayload.assignments as ApiDispatchAssignment[])
          : [];
        const attendance =
          attendancePayload && typeof attendancePayload === "object"
            ? (attendancePayload as AttendanceMap)
            : {};

        setDashboard(
          buildDashboardState(users, vans, members, reports, attendance, dispatchAssignments),
        );

        if (usersRes?.status === 401) {
          setLoadError("Login required to load the complete user list.");
        } else if (showRefreshToast) {
          // You can implement a toast notification here
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load live admin data.");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [apiUrl],
  );

  useEffect(() => {
    void loadLiveDashboard();
  }, [loadLiveDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadLiveDashboard({ silent: true });
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [loadLiveDashboard]);

  return { dashboard, isLoading, loadError, loadLiveDashboard };
}
