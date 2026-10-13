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

// 2. Appointments
import AppointmentsList from "../pages/Appointments/List";
import AppointmentDetail from "../pages/Appointments/Detail";

// 3. Clinics
import ClinicsList from "../pages/Clinics/List";
import ClinicDetail from "../pages/Clinics/Detail";
import Referrals from "../pages/Clinics/Referrals";

// 4. Vets
import VetsList from "../pages/Vets/List";
import VetDetail from "../pages/Vets/Detail";

// 5. Pet owners
import OwnersList from "../pages/Owners/List";
import OwnerDetail from "../pages/Owners/Detail";

// 6. Finance
import FinanceReports from "../pages/Finance/Reports";
import Transactions from "../pages/Finance/Transactions";

// 7. Clinic settlements
import Settlements from "../pages/Settlements/index";

// 10. Admin management
import AdminsList from "../pages/Admins/AdminsList";
import Roles from "../pages/Admins/Roles";
import AuditLog from "../pages/Admins/AuditLog";
import ViewAsClinic from "../pages/Admins/ViewAsClinic";

// `section` drives the role check in routes/route.jsx
const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard />, section: "dashboard" },

  { path: "/appointments", component: <AppointmentsList />, section: "appointments" },
  { path: "/appointments/:id", component: <AppointmentDetail />, section: "appointments" },

  { path: "/clinics", component: <ClinicsList />, section: "clinics" },
  { path: "/clinics/requests", component: <ClinicsList requests />, section: "clinics" },
  { path: "/clinics/referrals", component: <Referrals />, section: "clinics" },
  { path: "/clinics/:id", component: <ClinicDetail />, section: "clinics" },
  // "View as clinic" is a support tool: anyone who can view clinics may use it; each use is audit-logged.
  { path: "/clinics/:id/view-as", component: <ViewAsClinic />, section: "clinics" },

  { path: "/vets", component: <VetsList />, section: "vets" },
  { path: "/vets/:id", component: <VetDetail />, section: "vets" },

  { path: "/owners", component: <OwnersList />, section: "owners" },
  { path: "/owners/:id", component: <OwnerDetail />, section: "owners" },

  { path: "/finance", component: <FinanceReports />, section: "finance" },
  { path: "/finance/transactions", component: <Transactions />, section: "finance" },

  { path: "/settlements", component: <Settlements />, section: "settlements" },

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
