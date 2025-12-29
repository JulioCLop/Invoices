import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PROJECTS_DATA_KEY } from "../utils/storageKeys";
import { fetchQuotes, saveQuote } from "../utils/supabaseApi";

const pagePackages = [
  { label: "Simple Page", price: "$200–$300" },
  { label: "Service Page", price: "$300–$450" },
  { label: "High-Impact Page", price: "$450–$600+" },
  { label: "Starter Website", price: "$1,200–$2,500" },
  { label: "Business Website", price: "$2,500–$6,000" },
  { label: "Advanced Website", price: "$6,000–$12,000+" },
];

const retainerPlans = [
  {
    title: "Basic",
    price: "$250/mo",
    detail: "3 hours monthly, updates, backups, fixes",
  },
  {
    title: "Standard",
    price: "$500/mo",
    detail: "7 hours monthly, new sections, SEO updates",
  },
  {
    title: "Premium",
    price: "$1,000/mo",
    detail: "15 hours, new pages, animations, optimization",
  },
  {
    title: "Elite",
    price: "$2,000/mo",
    detail: "35 hours, full partnership, monthly builds",
  },
];

const retainerExamples = [
  {
    label: "$250/mo Example",
    detail: "Weekly updates, backups, text/image edits",
  },
  {
    label: "$500/mo Example",
    detail: "2 new sections monthly, SEO, speed work",
  },
  {
    label: "$1,000/mo Example",
    detail: "1 new page monthly, animations, optimization",
  },
];

const projectExamples = [
  {
    label: "Starter Website — $1,800",
    detail: "4 pages, SEO, contact form, 2 custom sections",
  },
  {
    label: "Business Website — $4,200",
    detail: "8 pages, animations, speed optimization, blog layout",
  },
  {
    label: "Advanced Website — $9,500",
    detail: "15 pages, API integrations, animations, 3 months support",
  },
];

const hourlyRates = [
  { label: "Standard", detail: "$65/hr" },
  { label: "Advanced", detail: "$85–$95/hr" },
  { label: "Rush", detail: "+25%" },
];

const hourlyExamples = [
  { label: "Fix broken layout (1.5 hrs)", price: "$97.50" },
  { label: "CSS animations (3 hrs)", price: "$255" },
  { label: "Emergency fix (2 hrs)", price: "$237.50" },
];

const taskPricing = [
  { task: "Install WordPress", price: "$50–$120" },
  { task: "Theme Setup", price: "$75–$200" },
  { task: "Plugin Setup", price: "$25–$100 each" },
  { task: "Hero Section", price: "$250–$500" },
  { task: "Custom Section", price: "$150–$350" },
  { task: "Animated Section", price: "$300–$700" },
  { task: "New Page (design+content)", price: "$200–$450" },
  { task: "Responsive Fix", price: "$40–$120" },
  { task: "Speed Optimization", price: "$150–$400" },
  { task: "SEO (per page)", price: "$50–$150" },
  { task: "Forms", price: "$75–$250" },
  { task: "Custom CSS", price: "$50–$300" },
  { task: "Bug Fixes", price: "$40–$150" },
];

const quoteInsights = [
  {
    title: "Avg. page build",
    metric: "$450",
    detail: "Mid-tier marketing page including copy polish.",
  },
  {
    title: "Retainer sweet spot",
    metric: "$1,000/mo",
    detail: "15 hrs for growth work and performance tuning.",
  },
  {
    title: "Most requested add-on",
    metric: "Custom sections",
    detail: "Animations + CMS hookups lead the demand.",
  },
];

const retainerHoursMap = {
  Basic: 3,
  Standard: 7,
  Premium: 15,
  Elite: 35,
};

const ESTIMATE_DEFAULT_TASKS = taskPricing.slice(0, 4).map((task) => task.task);
const STANDARD_HOURLY_RATE = 85;

const packageBudgetHints = {
  "Simple Page": 300,
  "Service Page": 450,
  "High-Impact Page": 600,
  "Starter Website": 2500,
  "Business Website": 6000,
  "Advanced Website": 12000,
};

const formatQuoteDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const deserializeQuote = (row) => ({
  id: row.id,
  projectName: row.project_name,
  clientName: row.client_name,
  selectedPackage: row.package,
  budget: Number(row.budget) || 0,
  notes: row.notes,
  timelineWeeks: Number(row.timeline_weeks) || 0,
  complexity: Number(row.complexity) || 1,
  estimateRange: {
    min: Number(row.estimate_min) || 0,
    max: Number(row.estimate_max) || 0,
  },
  perWeekRange: {
    min: Number(row.per_week_min) || 0,
    max: Number(row.per_week_max) || 0,
  },
  retainerPlan: row.retainer_plan,
  selectedTasks: Array.isArray(row.selected_tasks) ? row.selected_tasks : [],
  createdAt: row.created_at,
});

const readProjects = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(PROJECTS_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const parsePriceRange = (range) => {
  if (!range) return { min: 0, max: 0 };
  const cleaned = range.replace(/[^\d–-]/g, "");
  const parts = cleaned.split(/[–-]/).filter(Boolean);
  if (parts.length === 0) return { min: 0, max: 0 };
  const min = Number(parts[0]) || 0;
  const max = Number(parts[1]) || min;
  return { min, max };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function Quote() {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(pagePackages[0].label);
  const [budget, setBudget] = useState(packageBudgetHints[selectedPackage]);
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [timelineWeeks, setTimelineWeeks] = useState(6);
  const [complexity, setComplexity] = useState(1.1);
  const [selectedTasks, setSelectedTasks] = useState(ESTIMATE_DEFAULT_TASKS);
  const [retainerPlan, setRetainerPlan] = useState(retainerPlans[1].title);
  const [quoteHistory, setQuoteHistory] = useState([]);
  const selectedPackageDetails = pagePackages.find(
    (pkg) => pkg.label === selectedPackage
  );

  const selectedTaskDetails = useMemo(
    () => taskPricing.filter((task) => selectedTasks.includes(task.task)),
    [selectedTasks]
  );

  const rawTaskTotals = useMemo(() => {
    return selectedTaskDetails.reduce(
      (acc, task) => {
        const range = parsePriceRange(task.price);
        acc.min += range.min;
        acc.max += range.max;
        return acc;
      },
      { min: 0, max: 0 }
    );
  }, [selectedTaskDetails]);

  const baseBudget = Number(budget) || packageBudgetHints[selectedPackage] || 0;

  const estimateRange = useMemo(() => {
    const min =
      rawTaskTotals.min > 0
        ? Math.round(rawTaskTotals.min * complexity)
        : Math.round(baseBudget * 0.85);
    const max =
      rawTaskTotals.max > 0
        ? Math.round(rawTaskTotals.max * complexity * 1.1)
        : Math.round(baseBudget * 1.2 || min);
    return { min, max };
  }, [rawTaskTotals, baseBudget, complexity]);

  const perWeekRange = useMemo(() => {
    if (!timelineWeeks) return { min: estimateRange.min, max: estimateRange.max };
    return {
      min: Math.round(estimateRange.min / timelineWeeks),
      max: Math.round(estimateRange.max / timelineWeeks),
    };
  }, [estimateRange, timelineWeeks]);

  const retainerHoursValue = retainerHoursMap[retainerPlan] || 0;
  const retainerMonthlyValue = retainerHoursValue * STANDARD_HOURLY_RATE;

  const selectedTaskCount = selectedTasks.length;

  const heroStats = [
    { label: "Packages in play", value: `${pagePackages.length}` },
    { label: "Hourly window", value: "$65–$95" },
    { label: "Retainer tiers", value: `${retainerPlans.length}` },
  ];

  const toggleTask = (taskLabel) => {
    setSelectedTasks((prev) =>
      prev.includes(taskLabel)
        ? prev.filter((task) => task !== taskLabel)
        : [...prev, taskLabel]
    );
  };

  const handleCopyQuoteSummary = async () => {
    const summary = [
      `Project: ${projectName || "Untitled"}`,
      `Client: ${clientName || "Client TBD"}`,
      `Package: ${selectedPackage}`,
      `Estimated range: ${formatCurrency(estimateRange.min)} – ${formatCurrency(
        estimateRange.max
      )}`,
      `Timeline: ${timelineWeeks} week(s)`,
      `Tasks: ${
        selectedTaskCount > 0 ? selectedTasks.join(", ") : "No tasks selected"
      }`,
      `Retainer plan: ${retainerPlan} (${formatCurrency(retainerMonthlyValue)}/mo)`,
    ].join("\n");
    try {
      await navigator.clipboard?.writeText(summary);
      setStatusMessage({
        type: "success",
        text: "Quote summary copied to your clipboard.",
      });
    } catch (err) {
      console.error("Unable to copy quote summary", err);
      setStatusMessage({
        type: "warning",
        text: "Clipboard blocked. Copy the details manually.",
      });
    }
  };

  const handleResetComposer = () => {
    setProjectName("");
    setClientName("");
    setSelectedPackage(pagePackages[0].label);
    setBudget(packageBudgetHints[pagePackages[0].label]);
    setNotes("");
    setTimelineWeeks(6);
    setComplexity(1.1);
    setSelectedTasks(ESTIMATE_DEFAULT_TASKS);
    setRetainerPlan(retainerPlans[1].title);
    setStatusMessage(null);
  };

  const handlePackageChange = (value) => {
    setSelectedPackage(value);
    if (packageBudgetHints[value]) {
      setBudget(packageBudgetHints[value]);
    }
  };

  const handleCreateProject = (event) => {
    event.preventDefault();
    if (!projectName.trim()) {
      setStatusMessage({
        type: "warning",
        text: "Add a project name before creating a project from the quote.",
      });
      return;
    }

    const projects = readProjects();
    const newProject = {
      id: Date.now(),
      name: projectName.trim(),
      client: clientName.trim() || "Client",
      budget: Number(budget) || 0,
      status: "Planning",
      quotePackage: selectedPackage,
      quoteNotes: notes.trim(),
      quoteTimelineWeeks: timelineWeeks,
      quoteEstimateRange: estimateRange,
      quoteTasks: selectedTaskDetails.map((task) => task.task),
      quoteRetainerPlan: retainerPlan,
      quoteRetainerValue: retainerMonthlyValue,
    };

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PROJECTS_DATA_KEY,
          JSON.stringify([...projects, newProject])
        );
      }
      setProjectName("");
      setClientName("");
      setNotes("");
      setStatusMessage({
        type: "success",
        text: "Project created. Head to Projects & Tasks to start tracking work.",
      });
    } catch (err) {
      console.error("Unable to create project from quote", err);
      setStatusMessage({
        type: "warning",
        text: "Unable to store project. Please try again.",
      });
    }
  };

  const handleSaveQuote = async () => {
    if (!projectName.trim()) {
      setStatusMessage({
        type: "warning",
        text: "Add a project name before saving the quote.",
      });
      return;
    }
    const payload = {
      id: Date.now().toString(),
      project_name: projectName.trim(),
      client_name: clientName.trim() || "Client",
      package: selectedPackage,
      budget: Number(budget) || 0,
      notes: notes.trim(),
      timeline_weeks: Number(timelineWeeks) || 0,
      complexity: Number(complexity) || 1,
      retainer_plan: retainerPlan,
      estimate_min: estimateRange.min,
      estimate_max: estimateRange.max,
      per_week_min: perWeekRange.min,
      per_week_max: perWeekRange.max,
      selected_tasks: selectedTasks,
      created_at: new Date().toISOString(),
    };
    try {
      const saved = await saveQuote(payload);
      setQuoteHistory((prev) => [deserializeQuote(saved), ...prev]);
      setStatusMessage({
        type: "success",
        text: "Quote saved to Supabase for later reference.",
      });
    } catch (error) {
      console.error("Unable to save quote", error);
      setStatusMessage({
        type: "warning",
        text: "Unable to save quote. Please try again.",
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchQuotes()
      .then((rows) => {
        if (!mounted) return;
        setQuoteHistory(rows.map(deserializeQuote));
      })
      .catch((error) => {
        console.error("Unable to load quotes", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="quote-page">
      <div className="container">
        <section className="quote-hero">
          <div className="quote-hero__content">
            <p className="eyebrow">Quote lab</p>
            <h1>Design pricing that sells itself</h1>
            <p className="muted hero-lede">
              Model packages, tasks, retainers, and printable proposals in one workspace.
              Turn approved quotes into projects without retyping a single line.
            </p>
            <div className="quote-hero__actions">
              <Link className="btn btn-primary" to="/invoice">
                Build invoice
              </Link>
              <Link className="btn btn-ghost" to="/projects">
                Projects & Tasks
              </Link>
              <button className="btn btn-ghost" type="button" onClick={handlePrintQuote}>
                Print quote
              </button>
            </div>
          </div>
          <div className="quote-hero__stats">
            {heroStats.map((stat) => (
              <div className="quote-stat" key={stat.label}>
                <p className="muted small">{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="quote-workspace">
          <div className="quote-composer quote-card">
            <header>
              <h2>Project quote composer</h2>
              <p className="muted">
                Select deliverables, dial in complexity, and generate an investment range
                your clients understand instantly.
              </p>
            </header>
            <form className="quote-composer__form" onSubmit={handleCreateProject}>
              <div className="quote-composer__grid">
                <label>
                  <span>Project name</span>
                  <input
                    className="input control"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Brightside Landing Revamp"
                  />
                </label>
                <label>
                  <span>Client</span>
                  <input
                    className="input control"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client name"
                  />
                </label>
                <label>
                  <span>Package</span>
                  <select
                    className="input control"
                    value={selectedPackage}
                    onChange={(e) => handlePackageChange(e.target.value)}
                  >
                    {pagePackages.map((pkg) => (
                      <option key={pkg.label} value={pkg.label}>
                        {pkg.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Budget estimate</span>
                  <input
                    className="input control"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min="0"
                  />
                </label>
                <label className="quote-slider">
                  <span>Timeline (weeks)</span>
                  <input
                    className="input control"
                    type="range"
                    min="2"
                    max="24"
                    value={timelineWeeks}
                    onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                  />
                  <div className="muted small">
                    {timelineWeeks} week{timelineWeeks === 1 ? "" : "s"} (~
                    {Math.max(1, Math.round(timelineWeeks / 4))} month plan)
                  </div>
                </label>
                <label className="quote-slider">
                  <span>Complexity</span>
                  <input
                    className="input control"
                    type="range"
                    min="1"
                    max="1.8"
                    step="0.1"
                    value={complexity}
                    onChange={(e) => setComplexity(Number(e.target.value))}
                  />
                  <div className="muted small">
                    {complexity <= 1.1
                      ? "Baseline scope"
                      : complexity < 1.4
                      ? "Enhanced visuals & CMS work"
                      : "High-touch animations / integrations"}
                  </div>
                </label>
              </div>
              <label>
                <span>Notes / scope highlights</span>
                <textarea
                  className="input control"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key deliverables, timelines, or approvals"
                />
              </label>
              <label>
                <span>Retainer plan (optional)</span>
                <select
                  className="input control"
                  value={retainerPlan}
                  onChange={(e) => setRetainerPlan(e.target.value)}
                >
                  {retainerPlans.map((plan) => (
                    <option key={plan.title} value={plan.title}>
                      {plan.title} – {plan.price}
                    </option>
                  ))}
                </select>
              </label>

              <div className="quote-task-grid">
                {taskPricing.map((task) => {
                  const isSelected = selectedTasks.includes(task.task);
                  return (
                    <label
                      key={task.task}
                      className={`quote-checkbox ${isSelected ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTask(task.task)}
                      />
                      <div>
                        <strong>{task.task}</strong>
                        <span className="muted small">{task.price}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="quote-estimate">
                <div>
                  <p className="muted small">Estimated investment</p>
                  <strong>
                    {formatCurrency(estimateRange.min)} – {formatCurrency(estimateRange.max)}
                  </strong>
                </div>
                <div>
                  <p className="muted small">Per-week cadence</p>
                  <strong>
                    {formatCurrency(perWeekRange.min)} – {formatCurrency(perWeekRange.max)}
                  </strong>
                </div>
                <div>
                  <p className="muted small">Tasks selected</p>
                  <strong>{selectedTaskCount}</strong>
                </div>
              </div>

              <div className="quote-builder__actions">
                <button className="btn btn-primary" type="submit">
                  Create project from quote
                </button>
                <button className="btn btn-ghost" type="button" onClick={handleSaveQuote}>
                  Save quote to database
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCopyQuoteSummary}
                >
                  Copy summary
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleResetComposer}>
                  Reset builder
                </button>
              </div>
              {statusMessage && (
                <p
                  className={`quote-builder__status quote-builder__status--${statusMessage.type}`}
                >
                  {statusMessage.text}
                </p>
              )}
            </form>
          </div>

          <div className="quote-sidebar">
            <div className="quote-card quote-summary-card">
              <h3>Quote snapshot</h3>
              <div className="quote-summary-card__range">
                <p className="muted small">Estimated range</p>
                <strong>
                  {formatCurrency(estimateRange.min)} – {formatCurrency(estimateRange.max)}
                </strong>
                <span className="muted small">
                  {timelineWeeks} week delivery · {selectedTaskCount} task
                  {selectedTaskCount === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="quote-summary-card__meta">
                <li>
                  <span className="muted small">Package</span>
                  <strong>{selectedPackage}</strong>
                </li>
                <li>
                  <span className="muted small">Retainer plan</span>
                  <strong>
                    {retainerPlan} · {formatCurrency(retainerMonthlyValue)}/mo
                  </strong>
                </li>
                <li>
                  <span className="muted small">Timeline</span>
                  <strong>{timelineWeeks} weeks</strong>
                </li>
              </ul>
              <div className="quote-summary-card__actions">
                <button className="btn btn-primary" type="button" onClick={handlePrintQuote}>
                  Print shareable PDF
                </button>
                <Link className="btn btn-ghost" to="/invoice">
                  Send invoice
                </Link>
              </div>
            </div>

            <div className="quote-card">
              <h3>Saved quotes</h3>
              {quoteHistory.length === 0 ? (
                <p className="muted small">
                  Save quotes to Supabase so approvals and follow ups are organized.
                </p>
              ) : (
                <ul className="quote-list">
                  {quoteHistory.slice(0, 3).map((quote) => (
                    <li key={quote.id}>
                      <strong>{quote.projectName || "Untitled quote"}</strong>
                      <span className="muted small">
                        {quote.clientName || "Client"} ·{" "}
                        {formatCurrency(quote.estimateRange?.min)} –
                        {formatCurrency(quote.estimateRange?.max)}
                      </span>
                      <span className="muted small">{formatQuoteDate(quote.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="quote-card">
              <h3>Pricing insights</h3>
              <ul className="quote-insights">
                {quoteInsights.map((insight) => (
                  <li key={insight.title}>
                    <strong>{insight.metric}</strong>
                    <p>{insight.title}</p>
                    <span className="muted small">{insight.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="quote-card">
              <h3>Project spotlights</h3>
              <ul className="quote-list quote-list--cards">
                {projectExamples.map((example) => (
                  <li key={example.label}>
                    <strong>{example.label}</strong>
                    <span className="muted">{example.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="quote-section quote-section--printable">
          <div className="quote-printable__toolbar">
            <div>
              <h2>Printable quote</h2>
              <p className="muted small">
                Preview the client-facing quote sheet. Update the composer first, then
                print or save to PDF.
              </p>
            </div>
            <button className="btn btn-primary" type="button" onClick={handlePrintQuote}>
              Print quote
            </button>
          </div>
          <div className="quote-printable__sheet">
            <header className="quote-printable__header">
              <div>
                <h3>Tri-Tech Studio</h3>
                <p>
                  123 Studio Lane · Austin, TX · hello@tritechstudio.com · (512) 555-0142
                </p>
              </div>
              <div className="quote-printable__client">
                <p className="muted small">Prepared for</p>
                <strong>{clientName || "Client Name"}</strong>
                <p className="muted small">Project</p>
                <span>{projectName || "New Website Engagement"}</span>
                <p className="muted small">Date</p>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </header>

            <section className="quote-printable__summary">
              <div>
                <p className="muted small">Recommended package</p>
                <strong>{selectedPackage}</strong>
                <span className="muted">
                  {selectedPackageDetails?.price || "Custom range"}
                </span>
              </div>
              <div>
                <p className="muted small">Estimated budget</p>
                <strong>{formatCurrency(Number(budget) || estimateRange.max)}</strong>
              </div>
              <div>
                <p className="muted small">Overview</p>
                <span>{notes || "Awaiting final scope notes."}</span>
              </div>
            </section>

            <table className="quote-printable__table">
              <thead>
                <tr>
                  <th>Scope item</th>
                  <th>Description</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {selectedTaskDetails.slice(0, 6).map((task) => (
                  <tr key={task.task}>
                    <td>{task.task}</td>
                    <td>
                      {selectedPackage.includes("Website")
                        ? "Custom website component"
                        : "Add-on task"}
                    </td>
                    <td>{task.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="quote-printable__grid">
              <div>
                <h4>Project highlights</h4>
                <ul>
                  {projectExamples.slice(0, 3).map((example) => (
                    <li key={example.label}>
                      <strong>{example.label}</strong>
                      <span>{example.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Retainer options</h4>
                <ul>
                  {retainerPlans.slice(0, 3).map((plan) => (
                    <li key={plan.title}>
                      <strong>
                        {plan.title} – {plan.price}
                      </strong>
                      <span>{plan.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="quote-printable__signatures">
              <div>
                <p className="muted small">Prepared by</p>
                <div className="signature-line"></div>
              </div>
              <div>
                <p className="muted small">Approved by</p>
                <div className="signature-line"></div>
              </div>
              <div>
                <p className="muted small">Approval date</p>
                <div className="signature-line"></div>
              </div>
            </section>
          </div>
        </section>

        <section className="quote-reference-grid">
          <div className="quote-card">
            <h3>Page packages</h3>
            <ul className="quote-list">
              {pagePackages.map((pkg) => (
                <li key={pkg.label}>
                  <strong>{pkg.label}</strong>
                  <span className="muted">{pkg.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="quote-card">
            <h3>Retainer playbook</h3>
            <ul className="quote-list">
              {retainerPlans.map((plan) => (
                <li key={plan.title}>
                  <strong>
                    {plan.title} · {plan.price}
                  </strong>
                  <span className="muted">{plan.detail}</span>
                </li>
              ))}
            </ul>
            <div className="quote-subpanel">
              <p className="muted small">Examples</p>
              <ul className="quote-list">
                {retainerExamples.map((example) => (
                  <li key={example.label}>
                    <strong>{example.label}</strong>
                    <span className="muted">{example.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="quote-card">
            <h3>Hourly rates</h3>
            <ul className="quote-list">
              {hourlyRates.map((rate) => (
                <li key={rate.label}>
                  <strong>{rate.label}</strong>
                  <span className="muted">{rate.detail}</span>
                </li>
              ))}
            </ul>
            <div className="quote-subpanel">
              <p className="muted small">Examples</p>
              <ul className="quote-list">
                {hourlyExamples.map((example) => (
                  <li key={example.label}>
                    <strong>{example.label}</strong>
                    <span className="muted">{example.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="quote-card">
            <h3>Task-based pricing</h3>
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {taskPricing.map((task) => (
                  <tr key={task.task}>
                    <td>{task.task}</td>
                    <td>{task.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
