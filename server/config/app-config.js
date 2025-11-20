import dotenv from "dotenv";
dotenv.config();

export default Object.freeze({
  PORT: process.env.PORT || 3001,
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  FRONTEND_URL: process.env.FRONTEND_URL,
  GOOGLE_SERVICE_ACCOUNT_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
});
