# FleetDash 🚀

> Real-Time Fleet Tracking & Management Dashboard

Welcome to the **FleetDash** repository! This is a full-stack real-time fleet tracking and management system. The project is organized as a monorepo containing a Node.js/Express backend and a React/TypeScript frontend.

---

## 🛠️ Tech Stack

- **Frontend:** React (v19), TypeScript, Vite, TailwindCSS (optional), React Router, Socket.io-client
- **Backend:** Node.js (ES Modules), Express (v5), Mongoose (MongoDB), Redis, Socket.io, Turf.js
- **Utilities & Code Style:** Prettier, EditorConfig, Concurrently

---

## 📂 Project Structure

```text
FleetDash/
├── backend/            # Express REST API & WebSockets Server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # HTTP Route Handlers
│   │   ├── middleware/  # Express middlewares (Auth, validation, errors)
│   │   ├── models/      # Mongoose schemas & models
│   │   ├── redis/       # Redis connection config & helper scripts
│   │   ├── routes/      # REST API route definitions
│   │   ├── scripts/     # Database seed and migration scripts
│   │   ├── services/    # Business logic & 3rd party integrations
│   │   ├── socket/      # WebSocket connections & real-time events
│   │   ├── tests/       # Jest unit and integration tests
│   │   ├── utils/       # Utility helper functions
│   │   ├── validators/  # Validation schemas
│   │   ├── workers/     # Background task queue consumers
│   │   └── server.js    # Backend Entry Point
│   └── .env.example     # Environment template
│
├── frontend/           # React + TypeScript SPA (Vite)
│   ├── src/
│   │   ├── assets/      # Static files (images, icons, SVGs)
│   │   ├── canvas/      # Canvas drawing & visualizer assets
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context Providers (Auth, Sockets)
│   │   ├── hooks/       # Custom React hooks (useSocket, useAuth)
│   │   ├── layouts/     # Page layout structures (Sidebar, Navbar)
│   │   ├── pages/       # Route-level components/views
│   │   ├── services/    # API request modules (Axios client setup)
│   │   ├── store/       # Global state management modules
│   │   ├── styles/      # Global CSS variables & styling themes
│   │   ├── types/       # TypeScript type & interface definitions
│   │   ├── utils/       # Frontend utility helper functions
│   │   └── main.tsx     # React Entry Point
│   └── .env.example     # Environment template
│
├── package.json        # Root package orchestration
└── .editorconfig       # Code layout configuration
```

---

## 🚀 Quick Start / Local Setup

Follow these steps to initialize and run the project locally on your machine:

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18.x or later recommended)
- **MongoDB** (Running locally on default port `27017` or a cloud-hosted MongoDB Atlas URI)
- **Redis** (Running locally on default port `6379` or a cloud-hosted Redis URL)

### 2. Clone the Repository

```bash
git clone https://github.com/AnasMalek12/FleetDash.git
cd FleetDash
```

### 3. Bootstrap the Project (Install Dependencies)

We have added a custom script to install dependencies for the root, backend, and frontend directories all in one go:

```bash
npm run bootstrap
```

_(Alternatively, you can manually run `npm install` inside the root, `/backend`, and `/frontend` folders)._

### 4. Configure Environment Variables

You must set up your environment configuration files:

1. **Backend Setup:**
   - Go to the `backend` folder.
   - Copy the template file and name it `.env`:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Open `backend/.env` and update the database URIs and JWT secrets if necessary.

2. **Frontend Setup:**
   - Go to the `frontend` folder.
   - Copy the template file and name it `.env`:
     ```bash
     cp frontend/.env.example frontend/.env
     ```
   - Open `frontend/.env` to configure your API URL variables.

### 5. Running the Application

To launch both the backend server and frontend client concurrently:

```bash
npm run dev
```

- **Backend API** will run at: [http://localhost:5000](http://localhost:5000)
- **Frontend Web App** will run at: [http://localhost:5173](http://localhost:5173)

---

## 💻 Available NPM Scripts

Run these scripts from the **root directory**:

| Command             | Action                                                                  |
| :------------------ | :---------------------------------------------------------------------- |
| `npm run bootstrap` | Installs dependencies for root, backend, and frontend.                  |
| `npm run dev`       | Runs the client and server concurrently with live reload.               |
| `npm run server`    | Runs only the backend developer server.                                 |
| `npm run client`    | Runs only the frontend Vite development client.                         |
| `npm run format`    | Auto-formats code in the entire project using Prettier rules.           |
| `npm run lint`      | Analyzes the project for code quality issues and enforces ESLint rules. |

---

## 🤝 Team Workflow & Code Style

To ensure a smooth collaboration among our 4 team members:

1. **Git Etiquette:**
   - Never commit your local `.env` files. They are automatically ignored by our `.gitignore`.
   - Create separate feature branches (`git checkout -b feature/your-feature-name`) instead of pushing directly to `main`.
2. **Code Formatting:**
   - We use **Prettier** to enforce formatting.
   - Before committing, run formatting to clean up your code:
     ```bash
     npm run format
     ```
   - **Tip for VS Code users:** Install the "Prettier - Code formatter" extension and turn on `"editor.formatOnSave": true` in your settings to auto-format every time you save.
