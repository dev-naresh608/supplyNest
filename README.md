# 📦 SupplyNest

Enterprise Distribution & Inventory Management System built with **React**, **Node.js**, **Express**, and **MongoDB**.

---

## ✨ Key Features

- **Role-Based Access Control (RBAC)**: Fine-grained permissions (SuperAdmin, Admin, Manager, Staff).
- **Inventory & Stock Tracking**: Real-time logging of stock movement across distribution points.
- **Product & Catalog Management**: Integrated with Cloudinary for asset uploads.
- **Secure Authentication**: JWT with HTTP-only cookies, password hashing, and rate limiting.
- **Modern Dashboard UI**: Built with React 19, Vite, Tailwind CSS, and Framer Motion.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Redux Toolkit, TanStack Query |
| **Backend** | Node.js, Express.js, Mongoose, Zod, Winston |
| **Database** | MongoDB |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed   # (Optional) Seeds default SuperAdmin and initial data
npm run dev    # Server runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Client runs on http://localhost:5173
```

---

## ⚙️ Environment Configuration

Backend configuration defaults are defined in `backend/src/config/env.js`. You can override them via `.env` in `backend/`:

- `PORT` (Default: `5000`)
- `MONGO_URI` (Default: `mongodb://127.0.0.1:27017/invora`)
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- `CLOUDINARY_*` (Cloud name, API key & secret for media)
- `CLIENT_URL` (Default: `http://localhost:5173`)
