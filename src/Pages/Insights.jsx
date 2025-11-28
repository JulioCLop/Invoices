import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { INVOICE_HISTORY_KEY } from "../utils/storageKeys";

const readInvoiceHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(INVOICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read invoice history", err);
    return [];
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

const formatMonthLabel = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
};

export default function Insights() {
  const [invoiceHistory, setInvoiceHistory] = useState(() => readInvoiceHistory());

  useEffect(() => {
    const syncHistory = () => setInvoiceHistory(readInvoiceHistory());
    window.addEventListener("storage", syncHistory);
    return () => window.removeEventListener("storage", syncHistory);
  }, []);

  const metrics = useMemo(() => {
    if (!invoiceHistory.length) {
      return {
        totalRevenue: 0,
        averageInvoice: 0,
        outstandingInvoices: 0,
        outstandingTotal: 0,
        averageAgeDays: 0,
        billedClients: 0,
      };
    }
    const totalRevenue = invoiceHistory.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const outstandingList = invoiceHistory.filter((inv) => !inv.paid);
    const outstandingTotal = outstandingList.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const now = Date.now();
    const averageAgeDays = outstandingList.length
      ? outstandingList.reduce((acc, invoice) => {
          const date = invoice.invoiceDate || invoice.createdAt || invoice.emailedAt;
          if (!date) return acc;
          const ageMs = now - new Date(date).getTime();
          return acc + Math.max(ageMs / (1000 * 60 * 60 * 24), 0);
        }, 0) / outstandingList.length
      : 0;
    const billedClients = new Set(
      invoiceHistory.map((inv) => inv.billToName || "Unnamed Client")
    ).size;
    return {
      totalRevenue,
      averageInvoice: totalRevenue / invoiceHistory.length,
      outstandingInvoices: outstandingList.length,
      outstandingTotal,
      averageAgeDays,
      billedClients,
    };
  }, [invoiceHistory]);

  const monthlyTrend = useMemo(() => {
    const buckets = invoiceHistory.reduce((acc, invoice) => {
      const date = invoice.createdAt || invoice.emailedAt;
      const timestamp = date ? new Date(date).getTime() : null;
      const bucketKey = timestamp
        ? `${new Date(timestamp).getFullYear()}-${(new Date(timestamp).getMonth() + 1)
            .toString()
            .padStart(2, "0")}`
        : "unknown";
      if (!acc[bucketKey]) {
        acc[bucketKey] = {
          label: date ? formatMonthLabel(date) : "Unknown",
          total: 0,
          count: 0,
          order: timestamp || 0,
        };
      }
      acc[bucketKey].total += Number(invoice.total || 0);
      acc[bucketKey].count += 1;
      return acc;
    }, {});
    return Object.entries(buckets)
      .filter(([key]) => key !== "unknown")
      .map(([, value]) => value)
      .sort((a, b) => a.order - b.order)
      .slice(-6);
  }, [invoiceHistory]);

  const forecast = useMemo(() => {
    if (!monthlyTrend.length) {
      return { nextMonth: 0, runRate: 0, conservative: 0, stretch: 0 };
    }
    const totals = monthlyTrend.map((month) => month.total);
    const runRate =
      totals.reduce((sum, value) => sum + value, 0) / monthlyTrend.length;
    const nextMonth = runRate * 1.05; // small growth optimism
    return { nextMonth, runRate, conservative: runRate * 0.85, stretch: nextMonth * 1.2 };
  }, [monthlyTrend]);

  const topClients = useMemo(() => {
    const tally = invoiceHistory.reduce((acc, invoice) => {
      const key = invoice.billToName || "Unnamed Client";
      if (!acc[key]) acc[key] = { name: key, total: 0, invoices: 0 };
      acc[key].total += Number(invoice.total || 0);
      acc[key].invoices += 1;
      return acc;
    }, {});
    return Object.values(tally)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoiceHistory]);

  const outstandingAging = useMemo(() => {
    const buckets = {
      "0-30": { total: 0, count: 0 },
      "31-60": { total: 0, count: 0 },
      "61-90": { total: 0, count: 0 },
      "90+": { total: 0, count: 0 },
    };
    const now = Date.now();
    invoiceHistory
      .filter((invoice) => !invoice.paid)
      .forEach((invoice) => {
        const date = invoice.invoiceDate || invoice.createdAt || invoice.emailedAt;
        if (!date) {
          buckets["0-30"].total += Number(invoice.total || 0);
          buckets["0-30"].count += 1;
          return;
        }
        const age = (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
        const amount = Number(invoice.total || 0);
        if (age <= 30) {
          buckets["0-30"].total += amount;
          buckets["0-30"].count += 1;
        } else if (age <= 60) {
          buckets["31-60"].total += amount;
          buckets["31-60"].count += 1;
        } else if (age <= 90) {
          buckets["61-90"].total += amount;
          buckets["61-90"].count += 1;
        } else {
          buckets["90+"].total += amount;
          buckets["90+"].count += 1;
        }
      });
    return buckets;
  }, [invoiceHistory]);

  const recentInvoices = useMemo(
    () =>
      [...invoiceHistory]
        .sort((a, b) => new Date(b.createdAt || b.emailedAt || 0) - new Date(a.createdAt || a.emailedAt || 0))
        .slice(0, 5),
    [invoiceHistory]
  );

  const actionItems = useMemo(() => {
    const items = [];
    if (metrics.outstandingTotal > 0) {
      items.push({
        title: "Follow up on outstanding balances",
        detail: `You have ${metrics.outstandingInvoices} unpaid invoices totaling ${formatCurrency(
          metrics.outstandingTotal
        )}. Average age is ${metrics.averageAgeDays.toFixed(1)} days.`,
      });
    }
    if (forecast.stretch > forecast.base * 1.1) {
      items.push({
        title: "Plan capacity for stretch forecast",
        detail: `Stretch projection suggests ${formatCurrency(
          forecast.stretch
        )} next month. Ensure resources are ready.`,
      });
    }
    if (topClients[0]?.total > metrics.totalRevenue * 0.35) {
      items.push({
        title: "Client concentration check",
        detail: `${topClients[0].name} accounts for ${formatCurrency(
          topClients[0].total
        )}. Consider diversifying upcoming work.`,
      });
    }
    if (items.length === 0) {
      items.push({
        title: "Keep momentum",
        detail: "No risks detected. Continue closing invoices and tracking progress.",
      });
    }
    return items;
  }, [metrics, forecast, topClients]);

  return (
    <div className="insights-page">
      <div className="container">
        <header className="insights-header">
          <div>
            <p className="eyebrow">Insights & Forecasting</p>
            <h1>Understand your revenue trajectory</h1>
            <p className="muted">
              Track who is spending, how much you are billing, and where your next
              month is headed.
            </p>
          </div>
          <div className="insights-actions">
            <Link className="btn btn-ghost" to="/invoice">
              Back to invoice
            </Link>
            <Link className="btn btn-primary" to="/transactions">
              View transactions
            </Link>
          </div>
        </header>

        <section className="insights-summary">
          <div className="insights-card">
            <p className="eyebrow">Total billed</p>
            <h2>{formatCurrency(metrics.totalRevenue)}</h2>
            <p className="muted">Across {invoiceHistory.length} invoices</p>
          </div>
          <div className="insights-card">
            <p className="eyebrow">Average invoice</p>
            <h2>{formatCurrency(metrics.averageInvoice || 0)}</h2>
            <p className="muted">Per finalized invoice</p>
          </div>
          <div className="insights-card">
            <p className="eyebrow">Outstanding</p>
            <h2>{formatCurrency(metrics.outstandingTotal || 0)}</h2>
            <p className="muted">
              {metrics.outstandingInvoices} invoice
              {metrics.outstandingInvoices === 1 ? "" : "s"} open
            </p>
          </div>
          <div className="insights-card">
            <p className="eyebrow">Active clients</p>
            <h2>{metrics.billedClients}</h2>
            <p className="muted">Unique bill-to records</p>
          </div>
          <div className="insights-card">
            <p className="eyebrow">Avg outstanding age</p>
            <h2>{metrics.averageAgeDays.toFixed(1)}d</h2>
            <p className="muted">Across unpaid invoices</p>
          </div>
        </section>

        <section className="insights-grid">
          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Monthly trend</h3>
              <span className="muted small">Last 6 months</span>
            </div>
            {monthlyTrend.length === 0 ? (
              <p className="muted">Add invoices to see monthly trends.</p>
            ) : (
              <div className="monthly-bars">
                {(() => {
                  const maxTotal = Math.max(...monthlyTrend.map((m) => m.total), 1);
                  return monthlyTrend.map((month) => (
                    <div className="monthly-bar" key={month.label}>
                      <div className="monthly-bar__label">{month.label}</div>
                      <div className="monthly-bar__track">
                        <div
                          className="monthly-bar__fill"
                          style={{ width: `${Math.min(100, (month.total / maxTotal) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="monthly-bar__value">
                        {formatCurrency(month.total)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Forecast</h3>
              <span className="muted small">Simple run-rate projection</span>
            </div>
            <div className="forecast-cards">
              <div>
                <p className="muted">Avg monthly run rate</p>
                <h4>{formatCurrency(forecast.runRate || 0)}</h4>
              </div>
              <div>
                <p className="muted">Projected next month</p>
                <h4>{formatCurrency(forecast.nextMonth || 0)}</h4>
              </div>
            </div>
            <div className="forecast-cards forecast-cards--scenario">
              <div>
                <p className="muted small">Conservative</p>
                <strong>{formatCurrency(forecast.conservative || 0)}</strong>
              </div>
              <div>
                <p className="muted small">Base</p>
                <strong>{formatCurrency(forecast.nextMonth || 0)}</strong>
              </div>
              <div>
                <p className="muted small">Stretch</p>
                <strong>{formatCurrency(forecast.stretch || 0)}</strong>
              </div>
            </div>
            <p className="muted small">
              Projection is a simple 5% lift on your recent run rate to help you
              plan upcoming cash flow.
            </p>
          </div>
        </section>

        <section className="insights-grid">
          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Pipeline risk & aging</h3>
              <span className="muted small">Outstanding balances by days</span>
            </div>
            <div className="aging-grid">
              {Object.entries(outstandingAging).map(([label, data]) => (
                <div className="aging-card" key={label}>
                  <p>{label} days</p>
                  <strong>{formatCurrency(data.total)}</strong>
                  <span className="muted small">{data.count} invoice(s)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Action plan</h3>
              <span className="muted small">Auto-generated suggestions</span>
            </div>
            <ul className="insights-list">
              {actionItems.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span className="muted small">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="insights-grid">
          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Top clients</h3>
              <span className="muted small">Revenue to date</span>
            </div>
            {topClients.length === 0 ? (
              <p className="muted">No clients yet. Send your first invoice.</p>
            ) : (
              <ul className="top-clients">
                {topClients.map((client) => (
                  <li key={client.name}>
                    <div>
                      <strong>{client.name}</strong>
                      <span className="muted small">
                        {client.invoices} invoice
                        {client.invoices === 1 ? "" : "s"} ·{" "}
                        {(
                          (client.total / (metrics.totalRevenue || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <span>{formatCurrency(client.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="insights-panel">
            <div className="panel-heading">
              <h3>Recent invoices</h3>
              <span className="muted small">Latest activity</span>
            </div>
            {recentInvoices.length === 0 ? (
              <p className="muted">Nothing invoiced yet.</p>
            ) : (
              <ul className="recent-invoices">
                {recentInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <div>
                      <strong>{invoice.invoiceNumber}</strong>
                      <span className="muted small">
                        {invoice.billToName || "Unnamed Client"}
                      </span>
                    </div>
                    <div>
                      <span>{formatCurrency(invoice.total)}</span>
                      <span className="muted small">
                        {invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleDateString()
                          : "Date unavailable"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
