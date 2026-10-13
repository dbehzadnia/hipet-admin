import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { canView, currentAdmin } from "../services/admins";

const Authmiddleware = ({ section, children }) => {
  if (!localStorage.getItem("authUser") || !currentAdmin()) {
    return <Navigate to="/login" />;
  }
  // Role check: sections the admin's role cannot view fall back to the dashboard.
  if (section && !canView(section)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <React.Fragment>{children}</React.Fragment>;
};

Authmiddleware.propTypes = {
  section: PropTypes.string,
  children: PropTypes.node,
};

export default Authmiddleware;
