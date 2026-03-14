# Complete File Analysis Report

This report provides a detailed breakdown of the functionality, structure, and details of every single file in the project.

## 1. `.env.local`
**Purpose**: Stores local environment variables specifically for the frontend application.
**Key Details**:
- **Environment Keys**: Includes local API base URL overrides, Stripe public keys, and Maps API keys.

## 2. `.gitignore`
**Purpose**: Specifies intentionally untracked files that Git should ignore.
**Key Details**:
- **Rules**: Ignores `node_modules`, `.next` build outputs, and `.env` secret files.

## 3. `README.md`
**Purpose**: Contains the primary documentation for setting up the application.
**Key Details**:
- **Markdown Docs**: Installation instructions and feature overviews.

---

## 4. `app/admin-dashboard/components/ActivityLog.tsx`
**Purpose**: Renders a UI timeline of recent historical system events for administrators.
**Key Details**:
- **`ActivityLogProps`**: Interface enforcing the structure of the incoming activity feed.
- **`ActivityLog`**: Functional React component mapping over activities and displaying them by timestamp.

## 5. `app/admin-dashboard/components/DispatchConsole.tsx`
**Purpose**: Allows admins to interact with active routes, change driver assignments, and simulate journey states.
**Key Details**:
- **`DispatchConsoleProps`**: Interface defining driver and vehicle availability properties.
- **`DispatchConsole`**: Handles user input to force a dispatch action via backend API requests.

## 6. `app/admin-dashboard/components/DriverRoster.tsx`
**Purpose**: Displays a list of all active and inactive drivers along with their performance metrics.
**Key Details**:
- **`DriverRoster`**: React component displaying a grid/table of users with `role='driver'`.

## 7. `app/admin-dashboard/components/FeedbackPanel.tsx`
**Purpose**: Provides an inbox-style view for admins to read free-form feedback submitted by end users.
**Key Details**:
- **`FeedbackPanel`**: Renders customer text feedback and associated rating systems.

## 8. `app/admin-dashboard/components/Header.tsx`
**Purpose**: Renders the persistent top navigation bar of the admin dashboard.
**Key Details**:
- **`Header`**: Contains page title, admin profile avatar, and global action buttons.

## 9. `app/admin-dashboard/components/IncidentQueue.tsx`
**Purpose**: Lists active support tickets and user-reported issues that require admin resolution.
**Key Details**:
- **`IncidentQueue`**: Renders items needing attention, includes buttons to mark tickets as "Resolved".

## 10. `app/admin-dashboard/components/StatsGrid.tsx`
**Purpose**: Renders key performance indicators (KPIs) like total active vehicles, passenger counts, and delays.
**Key Details**:
- **`StatsGrid`**: Displays numerical summaries ingested from the live dashboard hook.

## 11. `app/admin-dashboard/hooks.ts`
**Purpose**: Contains custom React hooks enabling the admin dashboard to fetch and sync live data.
**Key Details**:
- **`useLiveDashboard`**: Sets up `setInterval` polling to the backend to continually refresh fleet state, incidents, and total driver rosters.

## 12. `app/admin-dashboard/page.tsx`
**Purpose**: The primary layout and container for the entire Admin experience.
**Key Details**:
- **`AdminPage`**: Orchestrates state from `useLiveDashboard` and passes it down to `DriverRoster`, `IncidentQueue`, `StatsGrid`, etc.

## 13. `app/admin-dashboard/styles.ts`
**Purpose**: Centralizes the complex Tailwind CSS string patterns used across dashboard components to reduce JSX clutter.
**Key Details**:
- **`styles`**: Object mapping semantic components (like "card", "badge") to massive Tailwind utility string definitions.

## 14. `app/admin-dashboard/types.ts`
**Purpose**: Contains the TypeScript definitions, Enums, and Interfaces utilized by the admin dashboard.
**Key Details**:
- **`DriverStatus`, `IncidentSeverity`**: Enums defining constrained string states used in the API responses.

## 15. `app/admin-dashboard/utils.ts`
**Purpose**: Provides pure helper functions to parse, filter, and format data for admin dashboard components.
**Key Details**:
- **`buildDashboardState`**: Aggregates disparate backend API arrays into a single coherent dashboard memory object.
- **`formatDate`**: Standardizes timestamp formatting for the activity log.

---

## 16. `app/cluster/page.tsx`
**Purpose**: A dedicated sub-page potentially meant for full-screen cluster viewing or invite-link join flows.
**Key Details**:
- **`ClusterPage`**: Fetches the cluster details using `code` and renders specific attendance parameters.

## 17. `app/components/ClusterManager.tsx`
**Purpose**: The highly complex, core client component managing driver route creation and user active participation interfaces.
**Key Details**:
- **`createCluster`**: Driver function executing POST `/api/clusters/create`.
- **`joinCluster`**: User function verifying codes via POST `/api/clusters/join`.
- **`handleSubscribe`**: Triggers Stripe checkout session logic based on premium tiers.

## 18. `app/components/JoinClusterModal.tsx`
**Purpose**: A localized popup component optimizing the UI for users to type in the 6-digit cluster access code.
**Key Details**:
- **`JoinClusterModal`**: Manages exact length controlled inputs and provides visual confirmation upon successful validation.

## 19. `app/components/ReportModal.tsx`
**Purpose**: A localized popup component allowing users to submit system bugs or behavioral feedback.
**Key Details**:
- **`ReportModal`**: Orchestrates text areas and posts the payload to `/api/reports`.

## 20. `app/context/LanguageContext.tsx`
**Purpose**: Provides React Context encapsulating the current application language, text direction (RTL/LTR), and translation helpers.
**Key Details**:
- **`LanguageProvider`**: The root wrapping component initializing the chosen language state.
- **`useLanguage`**: The hook returning the `t` (translate) function used globally by all text components.

## 21. `app/globals.css`
**Purpose**: The root cascading stylesheet binding Tailwind CSS primitives and application-wide CSS variables natively.
**Key Details**:
- **Tailwind Injections**: Contains `@tailwind base; @tailwind components; @tailwind utilities;`.

## 22. `app/i18n/translations.ts`
**Purpose**: The dictionary file statically defining text strings mapping English and Arabic keys.
**Key Details**:
- **`translations`**: Extremely large object containing contextual paths like `translations.en.auth.login`.

## 23. `app/layout.tsx`
**Purpose**: Defines the `<html>` and `<body>` HTML skeleton for the entire Next.js App Router application.
**Key Details**:
- **`RootLayout`**: Injects localized fonts (`geistSans`, `notoArabic`) and the `LanguageProvider` at the highest level of the DOM tree.

## 24. `app/login/page.tsx`
**Purpose**: Renders the UI and processes the authentication flow for new and returning users.
**Key Details**:
- **`Login`**: Controlled forms managing email/password states, toggling Driver vs User modes, and hitting `/api/auth/login`.

## 25. `app/page.tsx`
**Purpose**: The core interactive landing view depicting the full-screen interactive Map and active fleet layout.
**Key Details**:
- **`Home`**: Integrates `@react-google-maps/api` to render the map, placing `Marker` elements continuously updating based on polled backend GPS data.

## 26. `app/profile/page.tsx`
**Purpose**: The user settings dashboard allowing manual capability adjustments and displaying their active cluster code.
**Key Details**:
- **`Profile`**: Contains inline `FileReader` logic saving uploaded photo blobs to `localStorage`, avoiding an S3 backend implementation.

## 27. `app/subscription/cancel/page.tsx`
**Purpose**: Status page indicating an aborted transaction.
**Key Details**:
- **`CancelPage`**: Visual red feedback UI and simple navigation hooks routing back to the main app dashboard.

## 28. `app/subscription/page.tsx`
**Purpose**: Sales page detailing Stripe Premium Packages to potential subscribers.
**Key Details**:
- **`SubscriptionPage`**: Renders Day, Week, and Month cards with dynamic backend pricing logic triggers.

## 29. `app/subscription/success/page.tsx`
**Purpose**: Status page indicating a finalized Stripe transaction and granting active premium privileges on the frontend.
**Key Details**:
- **`SuccessPage`**: Updates the `tracker_user` config in memory granting `isSubscribed: true`.

---

## 30. `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `package.json`
**Purpose**: The core compilation, dependencies, linting, and build configuration files allowing Next.js and Tailwind to run appropriately.

---

## 31. `server/.env`
**Purpose**: Defines sensitive environment variables for the Node.js API runtime. Includes `MONGO_URI` and `JWT_SECRET`.

## 32. `server/src/app.ts`
**Purpose**: The primary Express execution pipeline.
**Key Details**:
- **`app`**: Instantiates global CORS usage, body-parsers, and orchestrates the `/api/*` mapping prefix over all imported routers.

## 33. `server/src/config/env.ts`
**Purpose**: A validation wrapper ensuring the `.env` variables exist across the system before attempting to boot up.
**Key Details**:
- **`PORT`, `JWT_SECRET`**: Strictly typed exports preventing undefined crashes.

## 34. `server/src/config/mongodb.ts`
**Purpose**: Manages the persistent network connection to the MongoDB Atlas cluster.
**Key Details**:
- **`connectDB`**: Asynchronous bootloader that wraps `mongoose.connect()`.

## 35. `server/src/config/stripe.ts`
**Purpose**: Initializes the official global Stripe SDK instance using the local secret keys.
**Key Details**:
- **`stripe`**: Instantiates `new Stripe(process.env.STRIPE_SECRET_KEY)`.

## 36. `server/src/controllers/auth.controller.ts`
**Purpose**: Handlers wrapping authentication HTTP Requests and formatting their JSON responses.
**Key Details**:
- **`signup`**: Defers body variables to `authService.signup`.
- **`login`**: Defers body variables to `authService.login`. Provides the JWT.

## 37. `server/src/controllers/bus.controller.ts`
**Purpose**: Orchestrates HTTP responses involving active GPS tracks and fleet analytics.
**Key Details**:
- **Handlers**: Combines raw database reads with formatting to provide lightweight arrays to frontend Map components.

## 38. `server/src/controllers/cluster.controller.ts`
**Purpose**: Parses group-management HTTP requests mapping Riders to Drivers.
**Key Details**:
- **`create` / `join`**: Formally connects a User `cluster_id` document to the specific Driver code sent over the req body.

## 39. `server/src/controllers/misc.controller.ts`
**Purpose**: Standard utility combinations parsing requests for simple objects like attendance tracking and incident tickets.
**Key Details**:
- **`ReportController`**, **`LocationController`**: Resolves generic read/write calls to MongoDB collections corresponding to these areas.

## 40. `server/src/middlewares/auth.middleware.ts`
**Purpose**: Security gate refusing HTTP traffic not possessing a valid JWT token.
**Key Details**:
- **`requireAuth`**: Extracts the Bearer Auth header, calls `jwt.verify`, rejecting 401 Unauthorized if invalid. Continues via `next()` if valid.

## 41. `server/src/middlewares/error.middleware.ts`
**Purpose**: Graceful degradation logic preventing unhandled server crashes during API operation.
**Key Details**:
- **`errorHandler`**: Takes `(err, req, res, next)` and guarantees a standard `{ success: false, error: "message" }` format string sent dynamically based on HTTP status.

## 42. `server/src/models/Attendance.ts`
**Purpose**: Defines the shape of rider daily statuses in MongoDB.
**Key Details**:
- **`AttendanceSchema`**: Contains strings linking an explicit date string, `user_id`, and constraints specifying attendance boolean.

## 43. `server/src/models/Cluster.ts`
**Purpose**: Defines the shape of the driver's group identifier in MongoDB.
**Key Details**:
- **`ClusterSchema`**: Exposes the 6 digit exact match `code` string tied to the `driver_id`.

## 44. `server/src/models/Location.ts`
**Purpose**: Fast-moving coordinate mapping within MongoDB.
**Key Details**:
- **`LocationSchema`**: Allows highly frequent index overwrites for real-time tracking of `lat`/`lng` integers and active driving boolean flags.

## 45. `server/src/models/Report.ts`
**Purpose**: Persistent storage template for support tickets.
**Key Details**:
- **`ReportSchema`**: Enforces strict severity, issue type, freeform message, and current resolve status fields.

## 46. `server/src/models/User.ts`
**Purpose**: Storage mechanism for application identity and encrypted passwords.
**Key Details**:
- **`UserSchema`**: Contains string schemas limiting roles to user, driver, or admin, and stores relational mappings.

## 47. `server/src/routes/*.routes.ts` (`auth`, `bus`, `cluster`, `misc`, `stripe`)
**Purpose**: Separated files cleanly defining the Express router paths and mapping exact String URIs (`/signup`, `/location`) to their respective Controller functions, applying the `auth.middleware` to secure ones.

## 48. `server/src/services/attendance.service.ts`
**Purpose**: Deep level Mongoose interaction for user attendance flags.
**Key Details**:
- **`AttendanceService`**: Enforces data creation and lookups to return exactly who is arriving at specific bus stops.

## 49. `server/src/services/auth.service.ts`
**Purpose**: Deep level Mongoose and cryptography combination.
**Key Details**:
- **`login`**: Operates on `bcryptjs` algorithm functions to salt and hash string payloads strictly on the server logic layer, isolating it entirely from the Controllers. Emits standard string JWTs.

## 50. `server/src/services/bus.service.ts`
**Purpose**: High level abstraction merging locations, clusters, and reports logic into a single file for more comprehensive queries.
**Key Details**:
- Contains overlapping data management like `resetSimulation()` logic which destroys all arrays for quick reset behavior.

## 51. `server/src/services/cluster.service.ts`
**Purpose**: Complex relational document management assigning Users securely to Groups.
**Key Details**:
- **`ClusterService`**: Ensures a User updating their `cluster_id` property targets a valid, existent group inside the Cluster collection.

## 52. `server/src/services/location.service.ts`
**Purpose**: Mathematical processing engines calculating geographical data.
**Key Details**:
- **`LocationService`**: Evaluates coordinate distances utilizing latitude and longitude arithmetic mapping.

## 53. `server/src/services/report.service.ts`
**Purpose**: System ticket tracking engine operations fetching issues and assigning resolved flags.
**Key Details**:
- **`ReportService`**: Orchestrates `Report.find()` executing filtering logic depending on query strings.

## 54. `server/test-cluster.js`
**Purpose**: Custom offline Node execution script used to simulate a live route via pure HTTP post requests sent mechanically.
**Key Details**:
- Builds fake user pools using an array of random generic names and pushes their theoretical geographical tracks.

## 55. `server/seed.js`
**Purpose**: Database resetting tools for developer environments ensuring clean slates.
**Key Details**:
- Bootstraps MongoDB instances rapidly clearing `User`, `Cluster`, `VanLocation` models.

## 56. `server/check_vans.js`
**Purpose**: Tiny script designed solely to print active van arrays inside terminal systems bypassing traditional API fetching.
**Key Details**:
- Instantiates raw mongoose queries and strictly uses console.logs.

## 57. `server/src/scripts/manage_cluster.ts`, `server/src/scripts/test_driver_auth.ts`
**Purpose**: Additional utility scripts executing manual system overrides and checking the stability of the JWT token generator outside standard API load testing.

## 58. `server/src/server.ts`
**Purpose**: Bootstraps the application inside Node invoking `app.listen()`.
**Key Details**:
- Instantiates `startServer` sequence forcing synchronous DB connection before allowing the HTTP listener pipe to open.
