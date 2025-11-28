import React from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/invoice", label: "Invoice" },
  { to: "/projects", label: "Projects" },
  { to: "/quote", label: "Quotes" },
  { to: "/schedule", label: "Schedule" },
  { to: "/expenses", label: "Expenses" },
  { to: "/tax", label: "Tax" },
  { to: "/insights", label: "Insights" },
  { to: "/transactions", label: "Transactions" },
];

export default function AppNavigation() {
  const location = useLocation();
  return (
    <nav className="app-nav">
      <div className="app-nav__brand">
        <Link to="/">Tri-Tech Ops Suite</Link>
      </div>
      <div className="app-nav__links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="app-nav__cta">
        <Link className="btn btn-primary" to="/invoice">
          New invoice
        </Link>
      </div>
    </nav>
  );
}
