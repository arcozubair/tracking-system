# Time Tracking System - Setup Guide

## Prerequisites

Ensure the following are installed on your system:

- **Node.js**: Version **20.13.1** or higher  
- **MongoDB**: Running locally (e.g., `mongodb://localhost:27017/timeTracking`)  
- **npm**: Installed along with Node.js  

---

## Project Structure

```
project-root/
├── backend/              # Node.js/Express server (http://localhost:3000)
│   └── scripts/
│       └── seed.js       # Seeds MongoDB with test Employees 
├── frontend/             # React application using Vite (http://localhost:5174)
├── package.json          # Root package with scripts using concurrently
```

---

## Setup and Running Instructions

### 1. Install Dependencies

Run the following command to install all dependencies for the root, backend, and frontend:

```bash
npm run install:all
```

This command:

- Installs `concurrently` in the root directory  
- Installs backend dependencies (`express`, `mongoose`, etc.)  
- Installs frontend dependencies (`react`, `axios`, `vite`, etc.)  

---

### 2. Start the Server

To seed the database and start both backend and frontend servers, run:

```bash
npm start
```

This command:

- Executes `backend/scripts/seed.js` to populate MongoDB with test data (e.g., TimeLog and BioBreak records for `Emp123`)  
- Starts the backend server at [http://localhost:5000](http://localhost:5000)  
- Starts the frontend Vite dev server at [http://localhost:5174](http://localhost:5174)  

---

## Accessing the Application

- **Frontend App**: Open [http://localhost:5174](http://localhost:5174) in your browser to access the login page  
- **Backend API**: Available at [http://localhost:5000/api/timelogs/](http://localhost:5000/api/timelogs/)  
  - Example Endpoints:  
    - `/login`  
    - `/status`