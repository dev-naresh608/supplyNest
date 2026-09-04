import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/invora",
  JWT_SECRET: process.env.JWT_SECRET || "invora_super_secret_jwt_key_2026_prod",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET ||
    "invora_refresh_secret_key_rotation_2026",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "invora_cookie_secret_hash_2026",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};
