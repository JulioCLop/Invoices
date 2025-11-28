import React from "react";
import { Link } from "react-router-dom";

const stats = [
  { value: "4.8 / 5", label: "Client rating" },
  { value: "$84K", label: "Processed last month" },
  { value: "2 min", label: "Average setup time" },
];

const perks = [
  {
    title: "Smart invoice builder",
    desc: "Pre-filled business sections keep every invoice consistent and on-brand.",
  },
  {
    title: "Live totals & taxes",
    desc: "Add items, fees, and discounts while totals recalc instantly in the sidebar.",
  },
  {
    title: "Reusable templates",
    desc: "Save polished invoices and spin up new ones in seconds for every client.",
  },
  {
    title: "Export ready",
    desc: "Share clean PDFs with one click and keep everything synced for accounting.",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__intro">
            <p className="eyebrow home-hero__eyebrow">Modern invoicing</p>
            <h1>Welcome to your new billing workspace</h1>
            <p className="home-hero__lead">
              Give clients a polished first impression and keep your numbers
              accurate with live calculations, templates, and a calm interface.
            </p>
            <div className="home-hero__cta">
              <Link to="/invoice" className="button button--primary">
                Launch the invoice workspace
              </Link>
              <Link to="/insights" className="button button--ghost">
                View insights dashboard
              </Link>
              <Link to="/quote" className="button">
                Pricing & quote sheet
              </Link>
              <Link to="/projects" className="button button--ghost">
                Projects & tasks
              </Link>
            </div>
            <div className="home-hero__stats">
              {stats.map((stat) => (
                <div className="home-stat" key={stat.label}>
                  <span className="home-stat__value">{stat.value}</span>
                  <span className="home-stat__label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="home-hero__card">
            <div className="home-card">
              <div className="home-card__header">
                <span className="home-card__badge">Instant preview</span>
                <p>
                  Build invoices line by line and watch totals, taxes, and
                  summaries react in real time.
                </p>
              </div>
              <ul className="home-card__list">
                <li>Client & project presets</li>
                <li>One-click tax toggles</li>
                <li>Download-ready output</li>
              </ul>
              <Link to="/invoice" className="home-card__link">
                Try the builder
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="home-section" id="features">
        <div className="container">
          <p className="eyebrow muted">What you get</p>
          <div className="home-section__header">
            <h2>Designed for teams who bill often</h2>
            <p>
              Skip the spreadsheets. Bring everything you need to create and
              share professional invoices into one focused workspace.
            </p>
          </div>
          <div className="home-grid">
            {perks.map((perk) => (
              <div className="perk-card" key={perk.title}>
                <h3>{perk.title}</h3>
                <p>{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
