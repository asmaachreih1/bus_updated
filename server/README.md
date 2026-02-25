# Backend (Express)

## Run

```bash
cd server
npm run dev
```

Or compile then run:

```bash
cd server
npm run build
node dist/src/server.js
```

## Structure

```text
src/
  server.ts
  app.ts
  config/
    env.ts
  routes/
    auth.routes.ts
    bus.routes.ts
  controllers/
    auth.controller.ts
    bus.controller.ts
  services/
    auth.service.ts
    bus.service.ts
  middlewares/
    auth.middleware.ts
    error.middleware.ts
  types/
    db.ts
    express.d.ts
  utils/
    fileDB.ts
db.json
```

## API

- Auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - Backward-compatible paths still supported:
    - `POST /api/signup`
    - `POST /api/login`
- Bus:
  - `GET /api/bus/vans`
  - `POST /api/bus/update-location`
  - `POST /api/bus/update-member`
  - `POST /api/bus/clusters/create`
  - `POST /api/bus/clusters/join`
  - `POST /api/bus/attendance`
  - `GET /api/bus/attendance`
  - `POST /api/bus/reports`
  - `GET /api/bus/reports`
  - `POST /api/bus/reports/resolve`
  - `GET /api/bus/reset`
  - Backward-compatible `/api/*` paths are also supported.
