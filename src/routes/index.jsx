import React from "react";
import { Navigate } from "react-router-dom";

// Authentication
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import ForgetPwd from "../pages/Authentication/ForgetPassword";
import UserProfile from "../pages/Authentication/user-profile";
import Pages404 from "../pages/Utility/pages-404";

// 1. Dashboard
import Dashboard from "../pages/Dashboard/index";

// 10. Admin management
import AdminsList from "../pages/Admins/AdminsList";
import Roles from "../pages/Admins/Roles";
import AuditLog from "../pages/Admins/AuditLog";

// `section` drives the role check in routes/route.jsx
const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard />, section: "dashboard" },

  { path: "/admins", component: <AdminsList />, section: "admins" },
  { path: "/admins/roles", component: <Roles />, section: "admins" },
  { path: "/admins/audit", component: <AuditLog />, section: "admins" },

  { path: "/profile", component: <UserProfile /> },
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "*", component: <Pages404 /> },
];

export { authProtectedRoutes, publicRoutes };
