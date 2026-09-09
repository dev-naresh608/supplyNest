# 📦 SupplyNest

> Enterprise Distribution & Inventory Management Platform built with React, Node.js, Express, and MongoDB.

---

### 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Redux Toolkit, TanStack Query
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Zod, Winston
- **Security & Media**: JWT (HTTP-only cookies), Helmet, Cloudinary

---

### ✨ Features

- **RBAC**: SuperAdmin, Admin, Manager, and Staff roles with granular permissions.
- **Inventory Tracking**: Real-time stock movement across distribution points.
- **Product Management**: Full catalog controls with Cloudinary media integration.
- **Secure Architecture**: Protected routes, rate limiting, and cookie-based auth.

---

### 🚀 Quick Start

```bash
# 1. Run Backend (http://localhost:5000)
cd backend
npm install
npm run dev

# 2. Run Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

> **Note**: Default DB runs on `mongodb://127.0.0.1:27017/invora`. Seed initial data anytime using `npm run seed` in the `backend/` directory.
