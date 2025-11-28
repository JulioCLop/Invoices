import React, { useMemo, useState } from "react";

const initialExpenses = [
  {
    id: 1,
    vendor: "Figma",
    category: "Software",
    amount: 38,
    date: "2024-06-01",
    notes: "Team license",
    reimbursable: false,
    status: "Cleared",
  },
  {
    id: 2,
    vendor: "AWS",
    category: "Hosting",
    amount: 210,
    date: "2024-06-03",
    notes: "Client infrastructure",
    reimbursable: true,
    status: "Pending",
  },
  {
    id: 3,
    vendor: "Upwork",
    category: "Contractor",
    amount: 450,
    date: "2024-06-05",
    notes: "Animation support",
    reimbursable: false,
    status: "Cleared",
  },
];

const categories = ["Software", "Hosting", "Contractor", "Travel", "Operations"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newExpense, setNewExpense] = useState({
    vendor: "",
    category: "Software",
    amount: "",
    date: "",
    notes: "",
    reimbursable: false,
    status: "Pending",
  });

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) =>
        categoryFilter === "all" ? true : expense.category === categoryFilter
      )
      .filter((expense) =>
        statusFilter === "all" ? true : expense.status === statusFilter
      )
      .filter((expense) => {
        if (!search.trim()) return true;
        const haystack = `${expense.vendor} ${expense.notes}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [expenses, categoryFilter, statusFilter, search]);

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const reimbursable = expenses
      .filter((expense) => expense.reimbursable)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const pending = expenses
      .filter((expense) => expense.status !== "Cleared")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    return { total, reimbursable, pending };
  }, [expenses]);

  const handleAddExpense = (event) => {
    event.preventDefault();
    if (!newExpense.vendor.trim() || !newExpense.amount) return;
    setExpenses((prev) => [
      {
        ...newExpense,
        id: Date.now(),
        vendor: newExpense.vendor.trim(),
        amount: Number(newExpense.amount),
      },
      ...prev,
    ]);
    setNewExpense({
      vendor: "",
      category: "Software",
      amount: "",
      date: "",
      notes: "",
      reimbursable: false,
      status: "Pending",
    });
  };

  const handleStatusChange = (id, status) => {
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === id ? { ...expense, status } : expense))
    );
  };

  const handleRemoveExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  return (
    <div className="page-wrap expenses-page">
      <div className="container">
        <section className="expenses-hero">
          <div className="expenses-hero__content">
            <p className="eyebrow">Expenses</p>
            <h1>Track cash leaving the business</h1>
            <p className="muted hero-lede">
              Capture reimbursements, vendor spend, and contractor invoices. Use it to inform quotes and tax planning.
            </p>
            <div className="expenses-actions">
              <label>
                <span>Search</span>
                <input
                  className="input control"
                  placeholder="Vendor or note"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  className="input control"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select
                  className="input control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Cleared">Cleared</option>
                </select>
              </label>
            </div>
          </div>
          <div className="expenses-hero__stats">
            <div className="expenses-stat">
              <p className="muted small">Monthly spend</p>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>
            <div className="expenses-stat">
              <p className="muted small">Reimbursable</p>
              <strong>{formatCurrency(totals.reimbursable)}</strong>
            </div>
            <div className="expenses-stat">
              <p className="muted small">Pending clearance</p>
              <strong>{formatCurrency(totals.pending)}</strong>
            </div>
          </div>
        </section>

        <section className="expenses-grid">
          <div className="expenses-card expenses-card--form">
            <header>
              <h2>Log expense</h2>
              <p className="muted small">Keep invoices aligned with real spend.</p>
            </header>
            <form className="expenses-form" onSubmit={handleAddExpense}>
              <label>
                <span>Vendor</span>
                <input
                  className="input control"
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, vendor: e.target.value }))}
                  placeholder="Vendor"
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  className="input control"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Amount</span>
                <input
                  className="input control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  className="input control"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
              <label>
                <span>Notes</span>
                <textarea
                  className="input control"
                  rows={2}
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
              <label className="expenses-checkbox">
                <input
                  type="checkbox"
                  checked={newExpense.reimbursable}
                  onChange={(e) =>
                    setNewExpense((prev) => ({ ...prev, reimbursable: e.target.checked }))
                  }
                />
                Reimbursable
              </label>
              <button className="btn btn-primary" type="submit">
                Add expense
              </button>
            </form>
          </div>

          <div className="expenses-card">
            <header>
              <h2>Cash burn insights</h2>
              <p className="muted small">Top categories</p>
            </header>
            <ul className="expenses-list">
              {categories.map((category) => {
                const categoryTotal = expenses
                  .filter((expense) => expense.category === category)
                  .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
                if (!categoryTotal) return null;
                const percent = totals.total
                  ? Math.round((categoryTotal / totals.total) * 100)
                  : 0;
                return (
                  <li key={category}>
                    <div>
                      <strong>{category}</strong>
                      <span className="muted small">{formatCurrency(categoryTotal)}</span>
                    </div>
                    <div className="expenses-progress">
                      <span style={{ width: `${percent}%` }}></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="expenses-table-card">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.vendor}</td>
                  <td>{expense.category}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.date || "—"}</td>
                  <td>
                    <select
                      className="input control"
                      value={expense.status}
                      onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Cleared">Cleared</option>
                    </select>
                  </td>
                  <td>{expense.notes || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => handleRemoveExpense(expense.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No expenses match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
