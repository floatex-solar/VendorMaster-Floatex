import { GoogleAuth } from "google-auth-library";
import appConfig from "../config/app-config.js";

const {
  GOOGLE_SERVICE_ACCOUNT1_BASE64,
  GOOGLE_SERVICE_ACCOUNT2_BASE64,
  GOOGLE_SERVICE_ACCOUNT3_BASE64,
  GOOGLE_SERVICE_ACCOUNT4_BASE64,
  GOOGLE_SERVICE_ACCOUNT5_BASE64,
} = appConfig;

function decodeCredentials(base64) {
  const json = Buffer.from(base64, "base64").toString("utf8");
  const creds = JSON.parse(json);

  if (!creds.client_email || !creds.private_key) {
    throw new Error("Invalid service account credentials");
  }
  return creds;
}

class AuthManager {
  constructor(accounts) {
    this.accounts = accounts.map(decodeCredentials);
    this.authClients = this.accounts.map(
      (credentials) =>
        new GoogleAuth({
          credentials,
          scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
          ],
        })
    );
    this.currentIndex = 0;
  }

  getAuth() {
    return this.authClients[this.currentIndex];
  }

  rotate() {
    if (this.authClients.length <= 1) return false;
    this.currentIndex = (this.currentIndex + 1) % this.authClients.length;
    return true;
  }
}

export const authManager = new AuthManager([
  GOOGLE_SERVICE_ACCOUNT1_BASE64,
  GOOGLE_SERVICE_ACCOUNT2_BASE64,
  GOOGLE_SERVICE_ACCOUNT3_BASE64,
  GOOGLE_SERVICE_ACCOUNT4_BASE64,
  GOOGLE_SERVICE_ACCOUNT5_BASE64,
]);
