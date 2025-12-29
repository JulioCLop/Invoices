import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchExecutionTasks,
  saveExecutionTask,
} from "../utils/supabaseApi";

const BOARD_COLUMNS = [
  { key: "backlog", title: "Backlog", color: "var(--muted)" },
  { key: "in_progress", title: "In progress", color: "var(--brand-pop)" },
  { key: "review", title: "Review", color: "#38bdf8" },
  { key: "done", title: "Done", color: "#34d399" },
];

const invoices = [
  { label: "Brand refresh", total: "$6,800", status: "Pending", due: "Oct 18" },
  { label: "Retainer", total: "$1,200 / mo", status: "Paid", due: "Sep 01" },
];

const scheduleEvents = [
  { label: "Client sync", time: "Mon · 10:00", details: "Review deliverables, share action items" },
  { label: "Sprint planning", time: "Tue · 13:00", details: "Map tasks, set goals with board" },
  { label: "Tax prep", time: "Thu · 16:00", details: "Upload receipts, verify mileage" },
];

const expenses = [
  { label: "Cloud hosting", amount: "$240", status: "Cleared" },
  { label: "Contractor", amount: "$1,100", status: "Pending" },
  { label: "Tools", amount: "$85", status: "Reimbursable" },
];

const taxHighlights = [
  { title: "Estimated liability", value: "$12,400", meta: "Based on invoices" },
  { title: "Quarterly due", value: "$3,100", meta: "Due Jan 15" },
  { title: "Deductions log", value: "34 entries", meta: "Receipts + mileage" },
];

const transactions = [
  { date: "Aug 22", description: "Stripe payout", amount: "+$4,500", category: "Income" },
  { date: "Aug 21", description: "Server cluster", amount: "-$320", category: "Operations" },
  { date: "Aug 20", description: "Client refund", amount: "-$250", category: "Refund" },
];

const insights = [
  { title: "Cash flow", detail: "+$18K this month" },
  { title: "Income vs. expenses", detail: "Ratio 2.5x" },
  { title: "Top client", detail: "Apex Ventures · $9.4K" },
];

export default function Home() {
  const [boardTasks, setBoardTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchExecutionTasks()
      .then((rows) => {
        if (!mounted) return;
        setBoardTasks(
          rows.map((task) => ({
            id: task.id,
            title: task.title || "Task",
            status: task.status || "backlog",
            client: task.client || "",
            priority: task.priority || "Normal",
          }))
        );
      })
      .catch((error) => {
        console.error("Unable to load execution tasks", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const groupedTasks = useMemo(() => {
    return BOARD_COLUMNS.map((col) => ({
      ...col,
      items: boardTasks.filter((task) => task.status === col.key),
    }));
  }, [boardTasks]);

  const handleAddTask = async () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const payload = {
      title: trimmed,
      status: "backlog",
      client: "",
      priority: "Normal",
    };
    try {
      const saved = await saveExecutionTask(payload);
      setBoardTasks((prev) => [
        ...prev,
        {
          id: saved.id,
          title: saved.title || trimmed,
          status: saved.status || "backlog",
          client: saved.client || "",
          priority: saved.priority || "Normal",
        },
      ]);
    } catch (error) {
      console.error("Unable to save task", error);
      setBoardTasks((prev) => [
        ...prev,
        { ...payload, id: Date.now() },
      ]);
    }
    setNewTaskTitle("");
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Productivity cockpit</p>
          <h1>All the control you need to run a modern solo studio</h1>
          <p className="muted hero-lede">
            Mix your runway, invoices, taxes, and insights inside one tech-forward workspace.
            Built for developers who want clarity without the fluff.
          </p>
        </div>
        <div className="dashboard-hero__actions">
          <Link className="btn btn-primary" to="/invoice">
            New invoice
          </Link>
          <Link className="btn btn-ghost" to="/projects">
            Projects
          </Link>
          <Link className="btn btn-ghost" to="/expenses">
            Log expense
          </Link>
        </div>
      </section>

      <section className="execution-board">
        <header>
          <div>
            <p className="eyebrow">Execution board</p>
            <h2>Kanban tracks</h2>
          </div>
          <div className="execution-actions">
            <input
              className="input control execution-input"
              placeholder="Quick add task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button className="btn btn-ghost" type="button" onClick={handleAddTask}>
              Add task
            </button>
          </div>
        </header>
        <div className="execution-board__grid">
          {groupedTasks.map((column) => (
            <article key={column.title} className="board-column">
              <h3>{column.title}</h3>
              <div className="board-column__items">
                {column.items.map((item) => (
                  <div key={item.id} className="board-card">
                    <p>{item.title}</p>
                    {item.client && (
                      <span className="muted tiny">{item.client}</span>
                    )}
                    <span
                      style={{ background: column.color }}
                      className="status-pill"
                    />
                  </div>
                ))}
                {column.items.length === 0 && (
                  <p className="muted small">Nothing here yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card scheduling-card">
          <header>
            <p className="eyebrow">Dynamic scheduling</p>
            <h2>Next meetings & deadlines</h2>
          </header>
          <div className="schedule-list">
            {scheduleEvents.map((event) => (
              <div key={event.label} className="schedule-item">
                <div>
                  <strong>{event.label}</strong>
                  <p className="muted small">{event.details}</p>
                </div>
                <span className="schedule-time">{event.time}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card invoicing-card">
          <header>
            <p className="eyebrow">Invoicing system</p>
            <h2>Status + templates</h2>
          </header>
          <div className="invoice-list">
            {invoices.map((invoice) => (
              <div key={invoice.label} className="invoice-row">
                <div>
                  <strong>{invoice.label}</strong>
                  <p className="muted small">Due {invoice.due}</p>
                </div>
                <div className="invoice-row__meta">
                  <span className={`status-pill status-pill--${invoice.status.toLowerCase()}`}>
                    {invoice.status}
                  </span>
                  <strong>{invoice.total}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-card__actions">
            <button className="btn btn-primary">Send template</button>
            <button className="btn btn-ghost">Export PDF</button>
          </div>
        </article>

        <article className="card expenses-card">
          <header>
            <p className="eyebrow">Expense tracking</p>
            <h2>Receipts & mileage</h2>
          </header>
          <ul>
            {expenses.map((expense) => (
              <li key={expense.label}>
                <div>
                  <strong>{expense.label}</strong>
                  <p className="muted small">{expense.status}</p>
                </div>
                <span>{expense.amount}</span>
              </li>
            ))}
          </ul>
          <div className="dashboard-card__actions">
            <button className="btn btn-ghost">Upload receipt</button>
            <button className="btn btn-ghost">Log mileage</button>
          </div>
        </article>

        <article className="card tax-card">
          <header>
            <p className="eyebrow">Tax overview</p>
            <h2>Live estimates</h2>
          </header>
          <div className="tax-grid">
            {taxHighlights.map((highlight) => (
              <div key={highlight.title} className="tax-stat-card">
                <strong>{highlight.value}</strong>
                <p className="muted small">{highlight.title}</p>
                <span className="muted tiny">{highlight.meta}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card transactions-card">
          <header>
            <p className="eyebrow">Transactions</p>
            <h2>Connected feeds</h2>
          </header>
          <div className="transactions-table">
            {transactions.map((transaction) => (
              <div key={transaction.description} className="transaction-row">
                <div>
                  <strong>{transaction.description}</strong>
                  <p className="muted small">{transaction.category}</p>
                </div>
                <div>
                  <span className="muted tiny">{transaction.date}</span>
                  <strong>{transaction.amount}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card insights-card">
          <header>
            <p className="eyebrow">Insights</p>
            <h2>Cash + client health</h2>
          </header>
          <div className="insights-grid">
            {insights.map((insight) => (
              <div key={insight.title} className="insight-tile">
                <strong>{insight.detail}</strong>
                <p className="muted small">{insight.title}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-footer">
        <div>
          <p className="eyebrow">Download & print</p>
          <h3>Export invoices, reports, and tax summaries to PDF or CSV</h3>
        </div>
        <div className="dashboard-footer__actions">
          <button className="btn btn-primary">Export report</button>
          <button className="btn btn-ghost">Print summary</button>
        </div>
      </section>
    </div>
  );
}
