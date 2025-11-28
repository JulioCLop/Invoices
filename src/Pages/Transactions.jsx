import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { INVOICE_HISTORY_KEY } from "../utils/storageKeys";

const tableColumns = [
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "client", label: "Client" },
  { key: "clientEmail", label: "Client Email" },
  { key: "recipientEmail", label: "Delivery Email" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
  { key: "emailedAt", label: "Dispatched" },
];

const loadHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(INVOICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to read invoice history", error);
    return [];
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return `${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } catch {
    return "—";
  }
};

const csvEscape = (value) => {
  const stringValue = value ?? "";
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export default function Transactions() {
  const [history, setHistory] = useState(() => loadHistory());
  const [lastSynced, setLastSynced] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const refreshHistory = () => {
    setHistory(loadHistory());
    setLastSynced(new Date());
  };

  useEffect(() => {
    refreshHistory();
    const handleStorage = (event) => {
      if (event.key === INVOICE_HISTORY_KEY) {
        refreshHistory();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totals = useMemo(() => {
    const collected = history
      .filter((invoice) => invoice.paid)
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const outstanding = history
      .filter((invoice) => !invoice.paid)
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    return { collected, outstanding };
  }, [history]);

  const statusSummary = useMemo(() => {
    const paid = history.filter((invoice) => invoice.paid).length;
    const unpaid = history.length - paid;
    return [
      { label: "Total invoices", value: history.length },
      { label: "Paid", value: paid },
      { label: "Unpaid", value: unpaid },
    ];
  }, [history]);

  const uniqueClients = useMemo(() => {
    const clients = history.reduce((acc, invoice) => {
      if (invoice.billToName) acc.add(invoice.billToName);
      return acc;
    }, new Set());
    return Array.from(clients).sort((a, b) => a.localeCompare(b));
  }, [history]);
  const computedRows = useMemo(
    () =>
      history.map((invoice, index) => ({
        id: invoice.id || `${invoice.invoiceNumber}-${index}`,
        rowNumber: index + 1,
        invoiceNumber: invoice.invoiceNumber || "N/A",
        client: invoice.billToName || "Unnamed Client",
        clientEmail: invoice.billToEmail || "Not provided",
        recipientEmail:
          invoice.recipientEmail || invoice.billToEmail || "Not provided",
        total: formatCurrency(invoice.total),
        totalRaw: Number(invoice.total) || 0,
        status: invoice.paid ? "Paid" : "Unpaid",
        createdAt: formatDate(invoice.createdAt),
        createdRaw: invoice.createdAt,
        emailedAt: formatDateTime(invoice.emailedAt),
        emailedRaw: invoice.emailedAt,
        paidRaw: invoice.paidAt,
      })),
    [history]
  );

  const filteredRows = useMemo(() => {
    return computedRows
      .filter((row) => {
        if (statusFilter === "paid") return row.status === "Paid";
        if (statusFilter === "unpaid") return row.status === "Unpaid";
        return true;
      })
      .filter((row) => {
        if (clientFilter === "all") return true;
        return row.client === clientFilter;
      })
      .filter((row) => {
        if (!search.trim()) return true;
        const haystack = `${row.invoiceNumber} ${row.client} ${row.clientEmail} ${row.recipientEmail}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .filter((row) => {
        if (!dateRange.from && !dateRange.to) return true;
        const createdTime = row.createdRaw ? new Date(row.createdRaw).getTime() : 0;
        if (dateRange.from) {
          if (createdTime < new Date(dateRange.from).getTime()) return false;
        }
        if (dateRange.to) {
          if (createdTime > new Date(dateRange.to).getTime()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "totalRaw") {
          return (a.totalRaw - b.totalRaw) * direction;
        }
        if (sortKey === "client") {
          return a.client.localeCompare(b.client) * direction;
        }
        const keyMap = {
          createdAt: "createdRaw",
          emailedAt: "emailedRaw",
          invoiceNumber: "invoiceNumber",
        };
        const aValue = keyMap[sortKey] ? a[keyMap[sortKey]] : a[sortKey];
        const bValue = keyMap[sortKey] ? b[keyMap[sortKey]] : b[sortKey];
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1 * direction;
        if (!bValue) return -1 * direction;
        return aValue.toString().localeCompare(bValue.toString()) * direction;
      });
  }, [
    computedRows,
    statusFilter,
    clientFilter,
    search,
    dateRange,
    sortKey,
    sortDirection,
  ]);

  const rows = filteredRows;

  const csvData = useMemo(() => {
    const header = ["Invoice #", "Client", "Client Email", "Delivery Email", "Status", "Total", "Created", "Dispatched"];
    const dataRows = rows.map((row) => [
      row.invoiceNumber,
      row.client,
      row.clientEmail,
      row.recipientEmail,
      row.status,
      row.total,
      row.createdAt,
      row.emailedAt,
    ]);
    return [header, ...dataRows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
  }, [rows]);

  const downloadCsv = () => {
    if (!rows.length) return;
    const blob = new Blob([csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `tri-tech-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrap transactions-page">
      <div className="container">
        <section className="transactions-hero">
          <div className="transactions-hero__content">
            <p className="eyebrow">Ledger View</p>
            <h1 className="page-title">Transaction Command Center</h1>
            <p className="muted hero-lede">
              Instantly see every invoice, filter by client or status, and export clean datasets for accounting or forecasting.
            </p>
            <p className="muted small">Last synced: {lastSynced.toLocaleString()}</p>
            <div className="transactions-actions">
              <button
                className="btn btn-primary"
                onClick={downloadCsv}
                disabled={!rows.length}
              >
                Download CSV
              </button>
              <button className="btn btn-ghost" type="button" onClick={refreshHistory}>
                Refresh
              </button>
              <Link className="btn btn-ghost" to="/invoice">
                Back to Invoice Builder
              </Link>
            </div>
          </div>
          <div className="transactions-stats">
            <div className="transactions-stat">
              <p className="muted small">Outstanding</p>
              <strong>{formatCurrency(totals.outstanding)}</strong>
            </div>
            <div className="transactions-stat">
              <p className="muted small">Collected</p>
              <strong>{formatCurrency(totals.collected)}</strong>
            </div>
            {statusSummary.map((item) => (
              <div className="transactions-stat" key={item.label}>
                <p className="muted small">{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="transactions-filters">
          <div className="transactions-filter-group">
            <label>
              <span>Search ledger</span>
              <input
                className="input control"
                placeholder="Invoice number, client, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="transactions-filter-group">
            <label>
              <span>Status</span>
              <select
                className="input control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>
            <label>
              <span>Client</span>
              <select
                className="input control"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="transactions-filter-group">
            <label>
              <span>From</span>
              <input
                className="input control"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </label>
            <label>
              <span>To</span>
              <input
                className="input control"
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Sort by</span>
              <select
                className="input control"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="createdAt">Created date</option>
                <option value="emailedAt">Dispatched</option>
                <option value="invoiceNumber">Invoice #</option>
                <option value="client">Client</option>
                <option value="totalRaw">Total</option>
              </select>
            </label>
            <label>
              <span>Direction</span>
              <select
                className="input control"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
          </div>
        </section>

        {rows.length === 0 ? (
          <div className="transactions-empty card">
            <h2>No transactions match</h2>
            <p className="muted">
              Adjust your filters or create an invoice to bring data into the ledger.
            </p>
            <Link className="btn btn-primary" to="/invoice">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <>
            <section className="transactions-overview-grid">
              <div className="transactions-overview-card">
                <h3>Outstanding invoices</h3>
                <ul className="transactions-list">
                  {rows
                    .filter((row) => row.status === "Unpaid")
                    .slice(0, 4)
                    .map((row) => (
                      <li key={`unpaid-${row.id}`}>
                        <div>
                          <strong>{row.invoiceNumber}</strong>
                          <span className="muted small">
                            {row.client} · {row.createdAt}
                          </span>
                        </div>
                        <div>
                          <span className="muted small">{row.status}</span>
                          <strong>{row.total}</strong>
                        </div>
                      </li>
                    ))}
                  {rows.filter((row) => row.status === "Unpaid").length === 0 && (
                    <li>
                      <p className="muted">All invoices are marked paid.</p>
                    </li>
                  )}
                </ul>
              </div>
              <div className="transactions-overview-card">
                <h3>Recently dispatched</h3>
                <ul className="transactions-list">
                  {rows
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.emailedRaw || 0) - new Date(a.emailedRaw || 0)
                    )
                    .slice(0, 4)
                    .map((row) => (
                      <li key={`recent-${row.id}`}>
                        <div>
                          <strong>{row.invoiceNumber}</strong>
                          <span className="muted small">{row.client}</span>
                        </div>
                        <div>
                          <span className="muted small">{row.emailedAt}</span>
                          <strong>{row.total}</strong>
                        </div>
                      </li>
                    ))}
                  {rows.length === 0 && (
                    <li>
                      <p className="muted">No invoices have been emailed yet.</p>
                    </li>
                  )}
                </ul>
              </div>
            </section>

            <div className="transactions-table-wrap">
              <table className="transactions-table" role="grid">
                <thead>
                  <tr>
                    <th scope="col" className="row-number-header">
                      #
                    </th>
                    {tableColumns.map((column) => (
                      <th key={column.key} scope="col">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="row-number-cell">{row.rowNumber}</td>
                      <td>{row.invoiceNumber}</td>
                      <td>{row.client}</td>
                      <td>{row.clientEmail}</td>
                      <td>{row.recipientEmail}</td>
                      <td>{row.total}</td>
                      <td>
                        <span
                          className={`transaction-status transaction-status--${
                            row.status === "Paid" ? "paid" : "unpaid"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.createdAt}</td>
                      <td>{row.emailedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
