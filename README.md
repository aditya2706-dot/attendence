# AI Biometric Face Attendance System (Enterprise Edition) 🚀

A professional, high-performance biometric attendance solution featuring real-time face recognition, anti-spoofing, and enterprise-grade security.

![Dashboard Preview](file:///Users/goyal/.gemini/antigravity/brain/e9c73ce2-e954-43a4-ae27-4c9bda292815/dashboard_overview_1773513152006.png)

## 🌟 Key Features (USPs)

### 📍 Geo-Fencing Security
Prevents "Proxy Attendance." The system only allows scanning if the user is physically within the authorized office/college perimeter. Admins can dynamically set the location and radius via an interactive map.

### 💾 Offline-First Resilience
"Zero Downtime." If the internet drops, the system continues to recognize faces and logs data locally using **IndexedDB**. Records are auto-synced to the cloud the moment the connection returns.

### 👁️ Anti-Spoofing (Liveness Detection)
Prevents spoofing using photos or videos. The system requires a natural **Blink** to verify liveness before marking attendance, powered by real-time EAR (Eye Aspect Ratio) analysis.

### 🎟️ Visitor Management (Quick Guest Pass)
Replaces paper logbooks. Instantly onboard visitors with a digital "Face Pass" template, enabling rapid biometric registration for temporary guests.

### 🔔 Real-time Arrival Alerts
Instant notifications sent via Slack Webhooks or Console alerts the moment a face is recognized, ensuring safety and visibility for parents or managers.

### 📅 Automated Reporting
Weekly attendance reports are automatically generated in CSV format and emailed to administrators using a scheduled CRON service.

---

## 🛠️ Tech Stack

**Frontend:**
- **Core:** React.js, Vite
- **AI:** face-api.js (Tiny Face Detector, Face Landmarks, Face Recognition)
- **Styling:** Tailwind CSS, Framer Motion
- **Maps:** React Leaflet (OpenStreetMap)
- **Data Visualization:** Recharts
- **Offline Storage:** IndexedDB (idb)
- **PWA:** vite-plugin-pwa

**Backend:**
- **Server:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, BcryptJS
- **Communication:** Nodemailer (Email), Axios (Slack Webhooks)
- **Task Scheduling:** Node-cron

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your .env (MONGO_URI, JWT_SECRET, etc.)
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🗺️ Configuration
Admins can access the **System Settings** page to:
- 📍 Click on the map to set the Office/Campus center.
- 📏 Adjust the scanning radius (m).
- 🤖 Tune the AI Recognition threshold.

---

## 📸 Screenshots

| Registration | Geofence Check |
| :---: | :---: |
| ![Register](file:///Users/goyal/.gemini/antigravity/brain/e9c73ce2-e954-43a4-ae27-4c9bda292815/register_guest_pass_verify_1773561098057.png) | ![Geofence](file:///Users/goyal/.gemini/antigravity/brain/e9c73ce2-e954-43a4-ae27-4c9bda292815/live_attendance_geofence_status_1773561212287.png) |

---

## 📄 License
MIT License. Created by [aditya2706-dot](https://github.com/aditya2706-dot).
