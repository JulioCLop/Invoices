import React, { useMemo, useState } from "react";

const initialRemittances = [
  { id: 1, quarter: "Q1", dueDate: "2024-04-15", amount: 1800, status: "Paid" },
  { id: 2, quarter: "Q2", dueDate: "2024-06-15", amount: 2000, status: "Pending" },
  { id: 3, quarter: "Q3", dueDate: "2024-09-15", amount: 0, status: "Upcoming" },
  { id: 4, quarter: "Q4", dueDate: "2025-01-15", amount: 0, status: "Upcoming" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

export default function TaxAssistant() {
  const [remittances, setRemittances] = useState(initialRemittances);
  const [estimate, setEstimate] = useState({
    revenue: 120000,
    expenses: 42000,
    rate: 25,
  });
  const [newRemittance, setNewRemittance] = useState({
    quarter: "Q3",
    amount: "",
    dueDate: "",
    status: "Pending",
  });

  const estimatedTax = useMemo(() => {
    const taxable = Math.max(0, Number(estimate.revenue) - Number(estimate.expenses));
    const tax = (taxable * Number(estimate.rate || 0)) / 100;
    return { taxable, tax };
  }, [estimate]);

  const quarterlyTarget = useMemo(() => {
    const paid = remittances.reduce((sum, remit) => sum + Number(remit.amount || 0), 0);
    const remaining = Math.max(0, estimatedTax.tax - paid);
    return {
      paid,
      remaining,
      quarterly: Math.round(estimatedTax.tax / 4),
    };
  }, [estimatedTax, remittances]);

  const handleEstimateChange = (field, value) => {
    setEstimate((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRemittance = (event) => {
    event.preventDefault();
    if (!newRemittance.amount || !newRemittance.dueDate) return;
    setRemittances((prev) => [
      ...prev,
      {
        ...newRemittance,
        id: Date.now(),
        amount: Number(newRemittance.amount),
      },
    ]);
    setNewRemittance({
      quarter: "Q3",
      amount: "",
      dueDate: "",
      status: "Pending",
    });
  };

  const handleStatusChange = (id, status) => {
    setRemittances((prev) =>
      prev.map((remit) => (remit.id === id ? { ...remit, status } : remit))
    );
  };

  return (
    <div className="page-wrap tax-page">
      <div className="container">
        <section className="tax-hero">
          <div className="tax-hero__content">
            <p className="eyebrow">Tax assistant</p>
            <h1>Forecast quarterly payments</h1>
            <p className="muted hero-lede">
              Keep your accountant happy. Estimate liabilities, log remittances, and stay ahead of quarterly deadlines.
            </p>
          </div>
          <div className="tax-hero__stats">
            <div className="tax-stat">
              <p className="muted small">Taxable income</p>
              <strong>{formatCurrency(estimatedTax.taxable)}</strong>
            </div>
            <div className="tax-stat">
              <p className="muted small">Estimated tax</p>
              <strong>{formatCurrency(estimatedTax.tax)}</strong>
            </div>
            <div className="tax-stat">
              <p className="muted small">Paid</p>
              <strong>{formatCurrency(quarterlyTarget.paid)}</strong>
            </div>
            <div className="tax-stat">
              <p className="muted small">Remaining</p>
              <strong>{formatCurrency(quarterlyTarget.remaining)}</strong>
            </div>
          </div>
        </section>

        <section className="tax-grid">
          <div className="tax-card">
            <header>
              <h2>Liability calculator</h2>
              <p className="muted small">Use your projected numbers.</p>
            </header>
            <div className="tax-form">
              <label>
                <span>Projected revenue</span>
                <input
                  className="input control"
                  type="number"
                  min="0"
                  value={estimate.revenue}
                  onChange={(e) => handleEstimateChange("revenue", e.target.value)}
                />
              </label>
              <label>
                <span>Projected expenses</span>
                <input
                  className="input control"
                  type="number"
                  min="0"
                  value={estimate.expenses}
                  onChange={(e) => handleEstimateChange("expenses", e.target.value)}
                />
              </label>
              <label>
                <span>Tax rate (%)</span>
                <input
                  className="input control"
                  type="number"
                  min="0"
                  max="60"
                  value={estimate.rate}
                  onChange={(e) => handleEstimateChange("rate", e.target.value)}
                />
              </label>
              <div className="tax-summary">
                <div>
                  <p className="muted small">Quarterly target</p>
                  <strong>{formatCurrency(quarterlyTarget.quarterly)}</strong>
                </div>
                <div>
                  <p className="muted small">Remaining liability</p>
                  <strong>{formatCurrency(quarterlyTarget.remaining)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="tax-card">
            <header>
              <h2>Record payment</h2>
              <p className="muted small">Log quarterly remittances.</p>
            </header>
            <form className="tax-form" onSubmit={handleAddRemittance}>
              <label>
                <span>Quarter</span>
                <select
                  className="input control"
                  value={newRemittance.quarter}
                  onChange={(e) =>
                    setNewRemittance((prev) => ({ ...prev, quarter: e.target.value }))
                  }
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </label>
              <label>
                <span>Amount</span>
                <input
                  className="input control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newRemittance.amount}
                  onChange={(e) =>
                    setNewRemittance((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Due date</span>
                <input
                  className="input control"
                  type="date"
                  value={newRemittance.dueDate}
                  onChange={(e) =>
                    setNewRemittance((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  className="input control"
                  value={newRemittance.status}
                  onChange={(e) =>
                    setNewRemittance((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </label>
              <button className="btn btn-primary" type="submit">
                Record payment
              </button>
            </form>
          </div>
        </section>

        <section className="tax-table-card">
          <table className="tax-table">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Due date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {remittances.map((remit) => (
                <tr key={remit.id}>
                  <td>{remit.quarter}</td>
                  <td>{formatDate(remit.dueDate)}</td>
                  <td>{formatCurrency(remit.amount)}</td>
                  <td>
                    <select
                      className="input control"
                      value={remit.status}
                      onChange={(e) => handleStatusChange(remit.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Upcoming">Upcoming</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => handleStatusChange(remit.id, "Paid")}
                    >
                      Mark paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
