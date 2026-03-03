export type DriverStatus = "available" | "on-duty" | "off-duty";
export type Shift = "Morning" | "Afternoon" | "Night";
export type FeedbackStatus = "new" | "reviewed" | "actioned";
export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "in-progress" | "resolved";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  experienceYears: number;
  safetyScore: number;
  status: DriverStatus;
  assignedBusId: string | null;
  shift: Shift | null;
};

export type Bus = {
  id: string;
  plateNumber: string;
  routeName: string;
  capacity: number;
  occupancy: number;
  status: "active" | "maintenance" | "idle";
  driverId: string | null;
};

export type Feedback = {
  id: string;
  driverId: string;
  driverName: string;
  rating: number;
  message: string;
  createdAt: string;
  status: FeedbackStatus;
};

export type Incident = {
  id: string;
  title: string;
  description: string;
  driverId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
};

export type Activity = {
  id: string;
  text: string;
  createdAt: string;
};

export type DashboardState = {
  drivers: Driver[];
  buses: Bus[];
  feedbacks: Feedback[];
  incidents: Incident[];
  activities: Activity[];
};

export type ApiUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  capacity?: number;
  createdAt?: string;
  phone?: string;
};

export type ApiVan = {
  id: string;
  lat?: number;
  lng?: number;
  occupancy?: number;
  isDriving?: boolean;
  lastUpdated?: string;
};

export type ApiMember = {
  id: string;
  lat?: number;
  lng?: number;
  name?: string;
  arrived?: boolean;
  lastUpdated?: string;
};

export type ApiReport = {
  id: string;
  userId: string;
  userName?: string;
  type?: string;
  message?: string;
  timestamp?: string;
  status?: string;
};

export type ApiDispatchAssignment = {
  busId: string;
  driverId: string;
  shift?: string;
  assignedAt?: string;
};

export type AttendanceMap = Record<string, string>;

export type DashboardStats = {
  onDuty: number;
  busesWithoutDriver: number;
  openIncidents: number;
  avgFeedback: number;
};
