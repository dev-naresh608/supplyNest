# SupplyNest (Invora Platform)

Enterprise Distribution & Inventory Management System built with Node.js, Express, MongoDB, and React.

## 🚀 Features

- **Modular Backend Architecture**: Clean separation of concerns with domain-driven modular structure (Auth, Inventory, Products, Roles, Stock Transactions).
- **Role-Based Access Control (RBAC)**: Fine-grained permission system supporting SuperAdmin, Admin, Manager, and staff roles.
- **Stock & Inventory Tracking**: Real-time logging of stock transactions and movement across distribution points.
- **Secure Authentication**: JWT-based auth with HTTP-only cookies, password hashing with bcrypt, rate limiting, and security headers via Helmet.
- **Media Uploads**: Cloudinary integration for product asset management.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Mongoose (MongoDB), Zod, Cloudinary, Winston
- **Frontend**: React.js, Vite
- **Database**: MongoDB

## 📦 Getting Started

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
