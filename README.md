# 🚌 Bus Tracker: Premium Live Training Logistics

A real-time, high-fidelity bus tracking solution designed for training groups in Lebanon (Beirut & South Lebanon). This project was born from a simple need: **coordinating student pickups safely and efficiently.**

## The "Why"
Coordinating bus pickups for training sessions can be stressful. Students often wait outside for long periods without knowing exactly where the driver is. 

**Bus Tracker** solves this by:
- Providing **live GPS tracking** of the van.
- Offering **individual ETAs** for every waiting member.
- Automating **arrival detection** (members are automatically checked in when the bus is 1 min away).
- Ensuring a **premium, responsive experience** that works perfectly on mobile while standing at a pickup point.

---

## Features
- **Live Map**: Custom-styled Google Maps restricted to Beirut/South Lebanon.
- **Dynamic Presence**: Each student joins with their name and appears as a person icon.
- **Smart ETA**: Uses Google Distance Matrix API for precise driving times.
- **Auto-Cleanup**: Arrived students are intelligently removed from the waiting list.
- **Glassmorphic UI**: A modern, light-themed aesthetic with white backgrounds, clean typography, and micro-animations.

---

## Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4.
- **Backend**: Node.js, Express (Real-time in-memory state).
- **APIs**: Google Maps JavaScript API, Google Directions API, Google Distance Matrix.

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/asmaachreih1/bus.git
cd bus
```

### 2. Install dependencies
Install both frontend and backend dependencies:
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Environment Variables
Create a `.env.local` in the root:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Run the project
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

---

## How to Push Changes

To save and push your changes to the project:

1. **Check status**:
   ```bash
   git status
   ```

2. **Stage and Commit**:
   ```bash
   git add .
   git commit -m "Describe your changes here"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   *(Note: If your branch is `master`, use `git push origin master` instead.)*

---

## Deployment Guide

### Backend (Render/Heroku/Railway)
The server in the `/server` folder is ready for production. 
1. Connect this repo to **Render.com**.
2. Set the "Base Directory" to `server`.
3. Start Command: `npm start`.

### Frontend (Vercel)
1. Connect this repo to **Vercel**.
2. Add the following Environment Variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your API Key.
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend.

---

## ✨ Developed by Asmaa Shreih
*Making training logistics smoother, one pickup at a time.*
