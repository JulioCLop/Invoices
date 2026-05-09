import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";
import PreviewModal from "../components/PreviewModal";
import TriTechLogo from "../components/TriTechLogo";
import AutoTextarea from "../components/AutoTextarea";

// Thornton, CO: state 2.9% + Adams County 0.75% + city 3.75% + RTD 1.1% + cultural 0.1%
const CO_TAX_RATE = 0.086;

const parseNum = (val) => {
  if (!val) return 0;
  const n = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
  return isNaN(n) ? 0 : n;
};

const fmt = (num) => num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInvNum = (n) => `INV-${String(n).padStart(3, "0")}`;

export default function InvoicePage() {
  const [clientName,   setClientName]   = useState(() => localStorage.getItem("triv2_inv_clientName")   || "");
  const [projectName,  setProjectName]  = useState(() => localStorage.getItem("triv2_inv_projectName")  || "");
  const [date,         setDate]         = useState(() => localStorage.getItem("triv2_inv_date")          || new Date().toLocaleDateString());
  const [estSubtext,   setEstSubtext]   = useState(() => localStorage.getItem("triv2_inv_estSubtext")   || "");

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("triv2_inv_items");
    if (saved) return JSON.parse(saved);
    return [{ service: "", subtext: "", rate: "", estHrs: "", high: "" }];
  });

  const subtotal = items.reduce((sum, item) => sum + parseNum(item.high), 0);
  const tax      = subtotal * CO_TAX_RATE;
  const totalDue = subtotal + tax;

  const [invoiceNumber, setInvoiceNumber] = useState(
    () => parseInt(localStorage.getItem("tri_inv_number") || "1")
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl,    setPreviewUrl]    = useState(null);
  const [confirmClear,  setConfirmClear]  = useState(false);
  const [generating,    setGenerating]    = useState(false);

  const docRef = useRef();

  useEffect(() => {
    localStorage.setItem("triv2_inv_clientName",  clientName);
    localStorage.setItem("triv2_inv_projectName", projectName);
    localStorage.setItem("triv2_inv_date",        date);
    localStorage.setItem("triv2_inv_estSubtext",  estSubtext);
    localStorage.setItem("triv2_inv_items",       JSON.stringify(items));
  }, [clientName, projectName, date, estSubtext, items]);

  const addRow     = () => setItems([...items, { service: "", subtext: "", rate: "", estHrs: "", high: "" }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === "rate" || field === "estHrs") {
      const r = parseNum(updated[i].rate);
      const h = parseNum(updated[i].estHrs);
      updated[i].high = (r && h) ? fmt(r * h) : "";
    }
    setItems(updated);
  };

  const buildPDF = async () => {
    const el = docRef.current;
    el.classList.add("is-printing");
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    el.querySelectorAll("textarea").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 4}px`;
    });
    const w = el.scrollWidth;
    const minPageHeight = Math.ceil(w * (11 / 8.5));
    el.style.minHeight = `${minPageHeight}px`;
    await new Promise(r => requestAnimationFrame(r));
    return {
      el,
      cleanup: () => {
        el.style.minHeight = "";
        el.classList.remove("is-printing");
      },
      opt: {
        margin: 0,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      },
    };
  };

  const generatePDF = async () => {
    if (generating) return;
    setGenerating(true);
    const { el, cleanup, opt } = await buildPDF();
    try {
      await html2pdf().set({ ...opt, filename: `${fmtInvNum(invoiceNumber)}_${clientName || "Draft"}.pdf` }).from(el).save();
      const next = invoiceNumber + 1;
      setInvoiceNumber(next);
      localStorage.setItem("tri_inv_number", String(next));
    } finally {
      cleanup();
      setGenerating(false);
    }
  };

  const generatePreview = async () => {
    if (generating) return;
    setGenerating(true);
    setIsPreviewOpen(true);
    setPreviewUrl(null);
    const { el, cleanup, opt } = await buildPDF();
    try {
      const url = await html2pdf().set({ ...opt, filename: "preview.pdf" }).from(el).output("bloburl");
      setPreviewUrl(url);
    } finally {
      cleanup();
      setGenerating(false);
    }
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    setClientName(""); setProjectName("");
    setDate(new Date().toLocaleDateString());
    setEstSubtext("");
    setItems([{ service: "", subtext: "", rate: "", estHrs: "", high: "" }]);
  };

  const rowLabelStyle = {
    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", textAlign: "right", whiteSpace: "nowrap",
  };
  const invoiceMetaWidth = 350;
  const invoiceValueStyle = {
    textAlign: "left",
    justifySelf: "start",
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "4rem", maxWidth: "920px" }}>

      {/* TOP NAV */}
      <div className="flex justify-between items-center mb-8 no-print">
        <div className="flex items-center gap-4">
          <Link to="/" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>← Home</Link>
          <h1 style={{ marginBottom: 0, fontSize: "1.75rem" }}>Invoice Creator</h1>
        </div>
        <div className="flex gap-4" style={{ alignItems: "center" }}>
          {confirmClear ? (
            <>
              <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>Clear everything?</span>
              <button className="btn btn-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }} onClick={handleClear}>Yes, Clear</button>
              <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }} onClick={() => setConfirmClear(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }} onClick={handleClear}>Clear</button>
          )}
          <button className="btn btn-secondary" onClick={generatePreview} disabled={generating}>{generating ? "Working…" : "Preview PDF"}</button>
          <button className="btn btn-primary"   onClick={generatePDF}     disabled={generating}>{generating ? "Working…" : "Download PDF"}</button>
        </div>
      </div>

      {/* DOCUMENT */}
      <div ref={docRef} className="print-document" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden", fontFamily: "'Outfit', sans-serif" }}>

        {/* HEADER */}
        <div style={{ background: "#213547", padding: "40px 44px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

          {/* LEFT — logo + contact */}
          <div>
            <TriTechLogo iconSize={40} dark />
            <div style={{ marginTop: "12px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.9 }}>
              tritechdevsolutions@gmail.com<br />720-984-4102
            </div>
          </div>

          {/* RIGHT — invoice meta */}
          <div style={{ width: `${invoiceMetaWidth}px` }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "16px", paddingLeft: "102px", textAlign: "left" }}>
              INVOICE
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", columnGap: "16px", rowGap: "12px", alignItems: "center" }}>
              {/* Invoice # */}
              <span style={{ ...rowLabelStyle, color: "#E43A36" }}>Invoice #</span>
              <input
                className="inline-input"
                value={fmtInvNum(invoiceNumber)}
                onChange={e => {
                  const n = parseInt(e.target.value.replace(/\D/g, "")) || 1;
                  setInvoiceNumber(n);
                  localStorage.setItem("tri_inv_number", String(n));
                }}
                style={{ ...invoiceValueStyle, fontWeight: 700, fontSize: "0.95rem", color: "#E43A36", width: "100px" }}
              />

              {/* Prepared for */}
              <span style={{ ...rowLabelStyle, color: "rgba(255,255,255,0.4)" }}>Prepared for</span>
              <input
                className="inline-input"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Client Name"
                style={{ ...invoiceValueStyle, fontWeight: 600, fontSize: "0.9rem", color: "#fff", width: "160px" }}
              />

              {/* Project */}
              <span style={{ ...rowLabelStyle, color: "rgba(255,255,255,0.4)" }}>Project</span>
              <input
                className="inline-input"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Project Name"
                style={{ ...invoiceValueStyle, fontWeight: 500, fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", width: "160px" }}
              />

              {/* Date */}
              <span style={{ ...rowLabelStyle, color: "rgba(255,255,255,0.4)" }}>Date</span>
              <input
                className="inline-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ ...invoiceValueStyle, fontWeight: 500, fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", width: "120px" }}
              />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: "36px 44px" }}>

          {/* SCOPE & PRICING */}
          <div style={{ marginBottom: "16px" }}>
            <div className="section-label" style={{ marginBottom: "14px" }}>Scope &amp; Pricing</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "#213547" }}>
                  <th style={{ padding: "11px 14px", textAlign: "left",  color: "#fff", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "42%" }}>Service</th>
                  <th style={{ padding: "11px 14px", textAlign: "right", color: "#fff", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "18%" }}>Rate / Hr</th>
                  <th style={{ padding: "11px 14px", textAlign: "right", color: "#fff", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "14%" }}>Hrs</th>
                  <th style={{ padding: "11px 14px", textAlign: "right", color: "#fff", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "22%" }}>Line Total</th>
                  <th className="no-print" style={{ width: "4%", background: "transparent" }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <AutoTextarea className="inline-input" style={{ fontWeight: 600, color: "#111827" }} value={item.service} onChange={e => updateItem(i, "service", e.target.value)} placeholder="Service name" />
                      <AutoTextarea className="inline-input" style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "3px" }} value={item.subtext} onChange={e => updateItem(i, "subtext", e.target.value)} placeholder="Description…" />
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end" }}>
                        <span style={{ color: "#9CA3AF", marginRight: "3px" }}>$</span>
                        <input className="inline-input" style={{ width: "60px", color: "#374151", textAlign: "right" }} value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)} placeholder="0.00" />
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <input className="inline-input" style={{ color: "#374151", textAlign: "right" }} value={item.estHrs} onChange={e => updateItem(i, "estHrs", e.target.value)} placeholder="0" />
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top", textAlign: "right" }}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{item.high ? `$${item.high}` : "—"}</span>
                    </td>
                    <td className="no-print" style={{ padding: "12px 8px", verticalAlign: "top", textAlign: "center" }}>
                      <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D1D5DB", fontSize: "1.1rem", lineHeight: 1, padding: "2px 4px" }}>×</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #E5E7EB", background: "#F9FAFB" }}>
                  <td colSpan={2} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#6B7280", fontSize: "0.82rem" }}>Subtotal</td>
                  <td />
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#111827" }}>{subtotal ? `$${fmt(subtotal)}` : "—"}</td>
                  <td className="no-print" />
                </tr>
                <tr style={{ background: "#F9FAFB" }}>
                  <td colSpan={2} style={{ padding: "6px 14px", textAlign: "right", fontWeight: 600, color: "#6B7280", fontSize: "0.82rem" }}>Sales Tax (Thornton, CO · 8.6%)</td>
                  <td />
                  <td style={{ padding: "6px 14px", textAlign: "right", fontWeight: 600, color: "#6B7280" }}>{tax ? `$${fmt(tax)}` : "—"}</td>
                  <td className="no-print" />
                </tr>
                <tr style={{ background: "#fff5f5", borderTop: "1px solid #fecaca" }}>
                  <td colSpan={2} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#E43A36", fontSize: "0.9rem" }}>Total Due</td>
                  <td />
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#E43A36", fontSize: "1rem" }}>{totalDue ? `$${fmt(totalDue)}` : "—"}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary no-print" onClick={addRow} style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", marginBottom: "32px" }}>+ Add Row</button>

          {/* NOTES SECTION */}
          <div style={{ marginBottom: "32px", padding: "0 14px" }}>
            <div className="section-label" style={{ marginBottom: "8px" }}>Notes</div>
            <AutoTextarea className="inline-input" style={{ fontSize: "0.85rem", color: "#6B7280" }} value={estSubtext} onChange={e => setEstSubtext(e.target.value)} placeholder="Add a note or payment instructions…" />
          </div>
          </div>

        {/* BOTTOM BANNER */}
        <div style={{ background: "linear-gradient(135deg, #1a2d3d 0%, #213547 60%, #2a4460 100%)", padding: "36px 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", color: "#E43A36", textTransform: "uppercase", marginBottom: "6px" }}>Total Amount Due</div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>Please remit payment within 15 days</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>${totalDue ? fmt(totalDue) : "0.00"}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>incl. {fmt(tax || 0)} tax (8.6%)</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: "0.65rem", padding: "28px 0", color: "#9CA3AF", letterSpacing: "0.05em", background: "#f9fafb" }}>
          {fmtInvNum(invoiceNumber)} &nbsp;·&nbsp; Tri-Tech &nbsp;·&nbsp; tritechdevsolutions@gmail.com
        </div>
      </div>

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} pdfUrl={previewUrl} title={`Invoice ${fmtInvNum(invoiceNumber)} — ${clientName || "Draft"}`} />
    </div>
  );
}
