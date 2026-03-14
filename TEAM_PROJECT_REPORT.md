# Van Tracker Fleet Management - Technical Codebase Report

This document outlines the purpose, functionality, and key technical implementation details of every major file in our project codebase. This is intended for the engineering team to understand the architecture, state management, and API surface of the system.

## 📱 Frontend (Next.js App Router)

### Core App & Layout
- **`app/layout.tsx`**: The main root layout (`RootLayout`). Wraps the entire application in the `LanguageProvider` so that translations and RTL layout state are available globally. It also configures Next.js metadata and body fonts.
- **`app/page.tsx`**: The main landing page. It conditionally renders the `BusTrackerApp` or the `AdminDashboard` based on the URL query parameter (`?view=admin`). It heavily relies on `useEffect` to poll the backend (`/api/bus/state`) for active vehicle coordinates, and utilizes `react-google-maps/api` to plot live markers.

### Admin Dashboard (`app/admin-dashboard/`)
- **`page.tsx`**: The entry component for the admin experience. It orchestrates child components and passes down the aggregated system state regarding active routes and reported incidents.
- **`components/DispatchConsole.tsx`**: Contains logic and UI to manually override bus locations, simulate traffic delays (`ETA + 10m` buttons), and force a trip completion status using `fetch('/api/bus/location', { method: 'POST' })`.
- **`components/DriverRoster.tsx`**: Fetches and lists users with `role === 'driver'` from the backend, parsing their profiles and current activity state.
- **`components/ActivityLog.tsx` & `IncidentQueue.tsx`**: Maps over an array of historical events or pending reports fetched from `/api/reports`, providing buttons to mark incidents as resolved (`POST /api/reports/resolve`).

### Clusters & Grouping
- **`app/components/ClusterManager.tsx`**: A crucial 400+ line component managing the lifecycle of a driver-rider link. 
  - **State**: Uses local state variables like `myCluster`, `attendance`, `members`, and reads fallback identifiers from `localStorage.getItem('tracker_user')`.
  - **Logic**: Depending on `user.role`, it presents either a "Create Cluster" input that posts to `/api/clusters/create`, or a "Join Cluster" input posting to `/api/clusters/join`. It also incorporates Stripe checkout logic, calling `/api/stripe/create-checkout-session` and redirecting `window.location.href`.
- **`app/components/JoinClusterModal.tsx`**: A simplified hook-based modal specifically handling the 6-digit code entry, updating the parent state upon successful validation.

### User System 
- **`app/login/page.tsx`**: The authentication page. It toggles between login and signup modes. Form submission triggers a POST to `/api/auth/login` or `/api/auth/signup`. It parses the returned JSON, stores the `token` and `tracker_user` objects in `localStorage`, and calls `router.push('/')`.
- **`app/profile/page.tsx`**: Displays user info by reading from `localStorage`. Implements an inline file uploader for profile photos using a `FileReader` that converts the image to a Base64 `DataURL` and saves it strictly in local storage (`profile_photo_<userId>`), bypassing backend storage entirely.

### Context & Localization
- **`app/context/LanguageContext.tsx`**: Uses React Context (`createContext`, `useContext`) to expose a `language` string ('en' or 'ar') and a translation helper function `t(key)`. The `t` function parses nested object paths corresponding to the JSON dictionaries in `translations.ts`.
- **`app/i18n/translations.ts`**: A TypeScript file exporting a multidimensional `translations` object mapping language keys inside `en` and `ar`.

---

## ⚙️ Backend (Node.js & Express - `server/src/`)

### Core Setup & Configuration
- **`server.ts` & `app.ts`**: The execution starts in `server.ts` listening on `PORT`. The `app.ts` file instantiates `express()`, configures `cors()`, `express.json()`, and mounts the routers onto `/api/`.
- **`config/env.ts`**: Uses the `dotenv` package to forcibly load `../../.env` overriding existing variables, ensuring uniform configuration across local and dev environments. Checks for `MONGODB_URI` existence.
- **`config/mongodb.ts`**: Implements an async helper function `connectDB()` wrapping `mongoose.connect()`.

### Models (Database Schema w/ Mongoose)
- **`models/User.ts`**: Mongoose schema storing fields like `id` (custom string ID, not ObjectId), `name`, `email`, password hash, `role` (enum: user, driver, admin), and relational IDs like `cluster_id`.
- **`models/Cluster.ts`**: Mongoose schema mapping a `code` to a specific `driver_id`. Does not maintain an explicit array of member IDs, relying on users having a matching `cluster_id`.
- **`models/Location.ts`**: Mongoose schema optimized for rapid updates. Tracks `lat`, `lng`, `isDriving` boolean, and `destination` strings.

### Controllers (Request Handlers)
- **`controllers/auth.controller.ts`**: Express route handlers (`req, res, next`) wrapping service layer calls inside `try/catch` blocks. E.g., `login` extracts `req.body`, awaits `authService.login()`, and `res.json({ user, token })`.
- **`controllers/bus.controller.ts`**: Handles `/api/bus/state` by awaiting `getVansState()`, formatting the response arrays representing live locations, and sending them back.
- **`controllers/cluster.controller.ts`**: Extracts `driverId`, `name`, or `code` from the request body to execute cluster matching and creation operations via the `ClusterService`.

### Services (Core Business Logic)
- **`services/auth.service.ts`**: Implements secure credential management. Uses `bcryptjs` for comparing password hashes. Generates signed JWTs using `jsonwebtoken` and the `JWT_SECRET`.
- **`services/cluster.service.ts`**: Implements `Cluster.findOne({ code })` lookups. Important: It handles joining a cluster by updating a User document's `cluster_id` rather than pushing to a Cluster document's members array.
- **`services/location.service.ts`**: Calculates geographic proximity mathematically. Uses spatial algorithms and timestamps to estimate driver arrival times (ETAs).
- **`services/report.service.ts`**: Executes `Report.find()` and `Report.findOneAndUpdate({ status: 'resolved' })` for admin ticket management.

### Routes (Express Routers)
- **`routes/auth.routes.ts`**: Binds HTTP methods to paths (e.g., `router.post('/login', authController.login)`).
- **`routes/cluster.routes.ts`**: Secures paths like `/api/clusters/create` behind the authentication middleware.

### Middlewares
- **`middlewares/auth.middleware.ts`**: Exported as `authenticate`. Extracts the `Bearer` token from the `Authorization` header, calls `jwt.verify(token, JWT_SECRET)`, and heavily relies on TypeScript augmentation to inject the decoded payload into `req.user`.
- **`middlewares/error.middleware.ts`**: Implements the standard `(err, req, res, next)` Express error signature to capture unhandled exceptions and return uniform `{ success: false, error: err.message }` responses.

### Testing & Simulation Tools
- **`server/test-cluster.js`**: An IIFE Node orchestration script calling raw Mongoose models to seed test datasets. Emits fake active tracking coordinates by formulating pure HTTP HTTP POST requests via the core `http.request()` Node module to bypass the UI entirely.
