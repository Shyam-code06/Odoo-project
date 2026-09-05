# PeoplePay360 — HRMS & Payroll System

An enterprise-grade Human Resource Management and Payroll ERP application inspired by Odoo. Built with React (Vite) on the frontend, Node.js (Express) on the backend, and MySQL.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router 7, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Knex.js, MySQL2, Nodemailer
- **Database**: MySQL 8.0+
- **Authentication**: JWT (Access & Refresh Tokens) with bcrypt password hashing

---

## ✨ Features

- **Authentication & RBAC**: Dual-token authentication (cookie/header) with role-based access control (Admin, HR Manager, Officer, Employee).
- **Employee Directory**: Full employee lifecycle, profiles, department hierarchies, and job positions.
- **Schedules & Attendance**: Weekly shift schedules, punch-in/out tracking with office GPS geofence validation and IP logging.
- **Time Off Management**: Custom leave types, leave balance allocation, and approval workflows.
- **Salary Rules & Structures**: Configurable salary rule categories, dynamic mathematical formulas, and contract-linked structures.
- **Payruns & Payslips**: Batch payroll processing, automated calculations (gross, net, allowances, deductions), and PDF/email payslip delivery via Nodemailer.
- **HR Dashboard**: Real-time stats on headcount, attendance rates, pending leaves, and payroll liability.

---

## 📂 Project Structure

```
Odoo-project/
├── client/          # React + Vite frontend
├── server/          # Express + Knex REST API backend
├── database.sql     # Database schema and initial seeds
├── package.json     # Root orchestration scripts
├── .gitignore       # Git ignore rules (protects .env & secrets)
└── README.md        # Project documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL Server** (v8.0+)

### 2. Database Setup
Import the database schema into your local MySQL server:
```bash
mysql -u root -p < database.sql
```
This creates the `odoo_db` database and its tables.

### 3. Environment Configuration
Create a `.env` file in the `server` folder by copying the example:

```bash
# Windows
copy server\.env.example server\.env

# macOS / Linux
cp server/.env.example server/.env
```

Update `server/.env` with your database credentials and secrets:
```env
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=odoo_db

# JWT Secrets (min 32 characters)
JWT_ACCESS_SECRET=your_jwt_access_secret_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# Office Geofence (Latitude, Longitude, Radius in meters)
OFFICE_LATITUDE=28.613939
OFFICE_LONGITUDE=77.209021
OFFICE_ALLOWED_RADIUS_METERS=500

# Mail Configuration (Optional - for payslip delivery)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_email_password
MAIL_FROM="PeoplePay360 Payroll <payroll@peoplepay360.com>"
```

### 4. Install Dependencies
```bash
# Install client and server dependencies
cd client && npm install
cd ../server && npm install
cd ..
```

### 5. Seed Roles & Permissions
```bash
cd server
npm run seed:rbac
cd ..
```

---

## 💻 Running the App

Run both services from the root folder in separate terminals:

**Backend Server (Runs on port 5000):**
```bash
npm run dev:server
```

**Frontend Client (Runs on port 5173):**
```bash
npm run dev:client
```

---

## 🧪 Testing

Run automated backend tests from the `server` directory:

```bash
cd server
npm run test:auth          # Authentication tests
npm run test:rbac          # RBAC & permissions tests
npm run test:master-data   # Departments, Job Positions tests
npm run test:employees     # Employee management tests
npm run test:phase5        # Schedules & contracts tests
npm run test:phase6        # Attendance & geofencing tests
npm run test:phase9        # Salary calculation engine tests
npm run test:phase10       # Payrun batch tests
npm run test:phase11       # Payslip generation tests
npm run test:phase12       # Dashboard & reporting tests
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).