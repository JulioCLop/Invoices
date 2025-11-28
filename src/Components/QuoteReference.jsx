import React from "react";

const quickPackages = [
  { label: "Simple Page", price: "$200–$300" },
  { label: "Service Page", price: "$300–$450" },
  { label: "High-Impact Page", price: "$450–$600+" },
  { label: "Starter Website", price: "$1,200–$2,500" },
];

const quickRetainers = [
  { label: "Basic", detail: "$250/mo · 3 hrs updates & fixes" },
  { label: "Standard", detail: "$500/mo · 7 hrs + new sections" },
  { label: "Premium", detail: "$1,000/mo · 15 hrs + animations" },
  { label: "Elite", detail: "$2,000/mo · 35 hrs partnership" },
];

const quickTasks = [
  { label: "Install WordPress", price: "$50–$120" },
  { label: "Theme Setup", price: "$75–$200" },
  { label: "Hero Section", price: "$250–$500" },
  { label: "Animated Section", price: "$300–$700" },
  { label: "Speed Optimization", price: "$150–$400" },
];

export default function QuoteReference() {
  return (
    <section className="quote-ref card">
      <div className="quote-ref__header">
        <div>
          <p className="eyebrow">Quick quote reference</p>
          <h2 className="card-title">Use ranges while drafting invoices</h2>
        </div>
        <p className="muted small">
          Full pricing sheet lives on the Quote page. Use this mini dashboard when
          assembling proposals or add-ons.
        </p>
      </div>

      <div className="quote-ref__grid">
        <div>
          <h3>Popular packages</h3>
          <ul className="quote-ref__list">
            {quickPackages.map((pkg) => (
              <li key={pkg.label}>
                <span>{pkg.label}</span>
                <strong>{pkg.price}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Retainer tiers</h3>
          <ul className="quote-ref__list quote-ref__list--stacked">
            {quickRetainers.map((plan) => (
              <li key={plan.label}>
                <strong>{plan.label}</strong>
                <span>{plan.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Task-based work</h3>
          <ul className="quote-ref__list">
            {quickTasks.map((task) => (
              <li key={task.label}>
                <span>{task.label}</span>
                <strong>{task.price}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
