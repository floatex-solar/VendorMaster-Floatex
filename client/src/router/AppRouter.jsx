// src/routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ItemsPage from "../pages/ItemsPage";
import VendorPage from "../pages/VendorPage";
import SearchPage from "../pages/SearchPage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/vendors" element={<VendorPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Route>

        {/* Default route → redirect to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
