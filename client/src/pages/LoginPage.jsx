import React from "react";
import LoginCard from "../components/auth/LoginCard";
import "./login.css";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-animated">
      <div className="w-full max-w-sm">
        <LoginCard />
      </div>
    </div>
  );
}
