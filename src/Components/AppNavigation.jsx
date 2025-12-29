import React, { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [location.pathname]);

  return (
    <nav className={`app-nav ${menuOpen ? "is-open" : ""}`}>
      <div className="app-nav__brand">
        <Link to="/">
          <img src="/tritech-logo.svg" alt="Tri-Tech Invoice" className="brand-logo" />
          <span>Tri-Tech Ops Suite</span>
        </Link>
      </div>
      <button
        type="button"
        className="app-nav__menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        <span aria-hidden="true" className="app-nav__menu-icon" />
      </button>
      <div
        id="primary-navigation"
        className={`app-nav__links ${menuOpen ? "is-visible" : ""}`}
      >
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`app-nav__link ${isActive ? "is-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="app-nav__cta">
        <Link className="btn btn-primary" to="/invoice">
          New invoice
        </Link>
      </div>
    </nav>
  );
}
