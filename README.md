# PeoplePay360 — HRMS & Payroll System

An enterprise Human Resource Management and Payroll ERP application built with React (Vite), Node.js (Express), and MySQL.

---

## 🔑 Default Login Credentials

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@gmail.com` | `admin123` | Full administrative control across all modules |
| **System Admin (Alt)** | `admin@odoo.local` | `Password123!` | Alternate admin account |
| **Employees (Seeded)** | `aarav.sharma@odoo.local` | `123456` | All 250 seeded employee accounts use password `123456` |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js (ES Modules), Knex.js, MySQL2, Nodemailer
- **Database**: MySQL 8.0+ (`odoo_db`)
- **Authentication**: JWT (Access & Refresh Tokens) with bcrypt hashing & RBAC

---

## 🚀 Quick Setup

### 1. Database Setup
Import the database schema into MySQL:
```bash
mysql -u root -p < database.sql
```

### 2. Environment Configuration
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Connection
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=odoo_db

# JWT Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32_chars!
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_32_chars!
JWT_REFRESH_EXPIRES_IN=7d

# Geofence (Office GPS Coordinates & Allowed Radius in meters)
OFFICE_LATITUDE=23.1895
OFFICE_LONGITUDE=72.6288
OFFICE_ALLOWED_RADIUS_METERS=500
```

### 3. Install Dependencies
```bash
# In client directory:
cd client && npm install

# In server directory:
cd ../server && npm install
```

### 4. Seed 250 Employees & Full Database Data
Populates 250 Indian employees, contracts, leave allocations, portal users, and sample payroll:
```bash
cd server
npm run seed
```

---

## 💻 Running the Application

Start backend and frontend in separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open your browser at **http://localhost:5173** and log in with `admin@gmail.com` / `admin123`.

---

## 📦 Core Modules

- **Employee Directory**: Profile management, department hierarchy, and job positions.
- **Contracts**: Salary structure mapping, wage tiers, and contract validity periods.
- **On-Site Attendance**: Geofence GPS check-in/out verification with interactive systray button.
- **Time Off & Leaves**: Leave allocation quotas, balance tracking, and approval workflow.
- **Payroll & Payslips**: Batch payruns, dynamic rule evaluation (Basic, HRA, PF, PT, Net Salary), and PDF export.

---

## 🧪 Automated Tests
Run backend test suites from `server/`:
```bash
npm run test:auth          # Auth & JWT tests
npm run test:rbac          # Roles & permissions
npm run test:employees     # Employee lifecycle
npm run test:phase5        # Contracts & schedules
npm run test:phase6        # Attendance & geofencing
npm run test:phase9        # Salary calculation engine
npm run test:phase10       # Batch payruns
```