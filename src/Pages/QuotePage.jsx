import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";
import PreviewModal from "../components/PreviewModal";
import TriTechLogo from "../components/TriTechLogo";
import AutoTextarea from "../components/AutoTextarea";

export default function QuotePage() {
  const [clientName, setClientName] = useState(() => localStorage.getItem("tri_clientName") || "");
  const [projectName, setProjectName] = useState(() => localStorage.getItem("tri_projectName") || "");
  const [date, setDate] = useState(() => localStorage.getItem("tri_date") || new Date().toLocaleDateString());

  const [estLow, setEstLow] = useState(() => localStorage.getItem("tri_estLow") || "");
  const [estMid, setEstMid] = useState(() => localStorage.getItem("tri_estMid") || "");
  const [estHigh, setEstHigh] = useState(() => localStorage.getItem("tri_estHigh") || "");
  const [estSubtext, setEstSubtext] = useState(() => localStorage.getItem("tri_estSubtext") || "");

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("tri_items");
    if (saved) return JSON.parse(saved);
    return [{ service: "", subtext: "", rate: "", estHrs: "", low: "", high: "" }];
  });

  const [subHrs, setSubHrs] = useState(() => localStorage.getItem("tri_subHrs") || "");
  const [subLow, setSubLow] = useState(() => localStorage.getItem("tri_subLow") || "");
  const [subHigh, setSubHigh] = useState(() => localStorage.getItem("tri_subHigh") || "");
  const [recRange, setRecRange] = useState(() => localStorage.getItem("tri_recRange") || "");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const docRef = useRef();

  useEffect(() => {
    localStorage.setItem("tri_clientName", clientName);
    localStorage.setItem("tri_projectName", projectName);
    localStorage.setItem("tri_date", date);
    localStorage.setItem("tri_estLow", estLow);
    localStorage.setItem("tri_estMid", estMid);
    localStorage.setItem("tri_estHigh", estHigh);
    localStorage.setItem("tri_estSubtext", estSubtext);
    localStorage.setItem("tri_items", JSON.stringify(items));
    localStorage.setItem("tri_subHrs", subHrs);
    localStorage.setItem("tri_subLow", subLow);
    localStorage.setItem("tri_subHigh", subHigh);
    localStorage.setItem("tri_recRange", recRange);
  }, [clientName, projectName, date, estLow, estMid, estHigh, estSubtext, items, subHrs, subLow, subHigh, recRange]);

  const parseNum = (val) => {
    if (!val) return 0;
    const num = parseFloat(val.toString().replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    let tLow = 0;
    let tHigh = 0;
    let tHrs = 0;
    items.forEach(item => {
      tLow += parseNum(item.low);
      tHigh += parseNum(item.high);
      tHrs += parseNum(item.estHrs);
    });

    if (tLow > 0 || tHigh > 0) {
      const mid = (tLow + tHigh) / 2;
      setSubLow(formatCurrency(tLow));
      setSubHigh(formatCurrency(tHigh));
      setEstLow(formatCurrency(tLow));
      setEstHigh(formatCurrency(tHigh));
      setEstMid(formatCurrency(mid));
      setRecRange(formatCurrency(mid));
    } else {
      setSubLow("");
      setSubHigh("");
      setEstLow("");
      setEstHigh("");
      setEstMid("");
      setRecRange("");
    }
    setSubHrs(tHrs > 0 ? tHrs.toString() : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addRow = () => setItems([...items, { service: "", subtext: "", rate: "", estHrs: "", low: "", high: "" }]);
  const removeItem = (i) => setItems(items.filter((_, index) => index !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const [generating, setGenerating] = useState(false);

  const buildPDF = async () => {
    const el = docRef.current;
    el.classList.add("is-printing");
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    el.querySelectorAll("textarea").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 4}px`;
    });
    const w = el.scrollWidth;
    const h = el.scrollHeight;
    const pageWidthMm = 210;
    const pageHeightMm = (h / w) * pageWidthMm + 6;
    return {
      el,
      opt: {
        margin: 0,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: w,
          height: h,
          windowWidth: w,
        },
        jsPDF: { unit: "mm", format: [pageWidthMm, pageHeightMm], orientation: "portrait" },
      },
    };
  };

  const generatePDF = async () => {
    if (generating) return;
    setGenerating(true);
    const { el, opt } = await buildPDF();
    try {
      await html2pdf().set({ ...opt, filename: `Quote_${clientName || 'Draft'}.pdf` }).from(el).save();
    } finally {
      el.classList.remove("is-printing");
      setGenerating(false);
    }
  };

  const generatePreview = async () => {
    if (generating) return;
    setGenerating(true);
    setIsPreviewOpen(true);
    setPreviewUrl(null);
    const { el, opt } = await buildPDF();
    try {
      const url = await html2pdf().set({ ...opt, filename: "preview.pdf" }).from(el).output("bloburl");
      setPreviewUrl(url);
    } finally {
      el.classList.remove("is-printing");
      setGenerating(false);
    }
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    setClientName("");
    setProjectName("");
    setDate(new Date().toLocaleDateString());
    setEstSubtext("");
    setItems([{ service: "", subtext: "", rate: "", estHrs: "", low: "", high: "" }]);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '920px' }}>

      {/* TOP NAV */}
      <div className="flex justify-between items-center mb-8 no-print">
        <div className="flex items-center gap-4">
          <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>← Home</Link>
          <h1 style={{ marginBottom: 0, fontSize: '1.75rem' }}>Quote Creator</h1>
        </div>
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          {confirmClear ? (
            <>
              <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>Clear everything?</span>
              <button className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={handleClear}>Yes, Clear</button>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setConfirmClear(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={handleClear}>Clear</button>
          )}
          <button className="btn btn-secondary" onClick={generatePreview} disabled={generating}>
            {generating ? 'Working…' : 'Preview PDF'}
          </button>
          <button className="btn btn-primary" onClick={generatePDF} disabled={generating}>
            {generating ? 'Working…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* DOCUMENT */}
      <div ref={docRef} style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        fontFamily: "'Outfit', sans-serif",
      }}>

        {/* HEADER BAND */}
        <div style={{ background: '#213547', padding: '32px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: '16px 16px 0 0' }}>

          {/* LEFT */}
          <div>
            <TriTechLogo iconSize={40} dark />
            <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.9 }}>
              tritechdevsolutions@gmail.com<br />720-984-4102
            </div>
          </div>

          {/* RIGHT — aligned grid */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' }}>QUOTE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: '14px', rowGap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', color: '#E43A36' }}>Prepared for</span>
              <input className="inline-input" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', textAlign: 'left', width: '160px' }} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" />

              <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Project</span>
              <input className="inline-input" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', textAlign: 'left', width: '160px' }} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Name" />

              <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Date</span>
              <input className="inline-input" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', textAlign: 'left', width: '120px' }} value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '36px 44px' }}>

          {/* ESTIMATE */}
          <div style={{ marginBottom: '32px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>Estimate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <div style={{ padding: '24px 20px', textAlign: 'center', borderRight: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '10px' }}>Low</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  $<input className="inline-input" style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#374151', padding: '4px 0', margin: 0, lineHeight: 1.2 }} value={estLow} onChange={e => setEstLow(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div style={{ padding: '24px 20px', textAlign: 'center', borderRight: '1px solid #fecaca', background: '#fff5f5', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#E43A36' }} />
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#E43A36', textTransform: 'uppercase', marginBottom: '10px' }}>Mid — Recommended</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E43A36', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  $<input className="inline-input" style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#E43A36', padding: '4px 0', margin: 0, lineHeight: 1.2 }} value={estMid} onChange={e => setEstMid(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div style={{ padding: '24px 20px', textAlign: 'center', background: '#FAFAFA' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '10px' }}>High</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  $<input className="inline-input" style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#374151', padding: '4px 0', margin: 0, lineHeight: 1.2 }} value={estHigh} onChange={e => setEstHigh(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </div>
            <AutoTextarea className="inline-input" style={{ marginTop: '10px', fontSize: '0.78rem', color: '#6B7280' }} value={estSubtext} onChange={e => setEstSubtext(e.target.value)} placeholder="Add a note about this estimate…" />
          </div>

          {/* SCOPE & PRICING */}
          <div style={{ marginBottom: '16px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>Scope &amp; Pricing</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#213547' }}>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: '30%' }}>Service</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: '15%' }}>Rate</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: '15%' }}>Est. Hrs</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: '18%' }}>Low</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: '18%' }}>High</th>
                  <th className="no-print" style={{ width: '4%', background: 'transparent' }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <AutoTextarea className="inline-input" style={{ fontWeight: 600, color: '#111827' }} value={item.service} onChange={e => updateItem(i, 'service', e.target.value)} placeholder="Service name" />
                      <AutoTextarea className="inline-input" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '3px' }} value={item.subtext} onChange={e => updateItem(i, 'subtext', e.target.value)} placeholder="Description…" />
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#9CA3AF', marginRight: '4px' }}>$</span>
                        <input className="inline-input" style={{ flex: 1, minWidth: 0, color: '#374151' }} value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} placeholder="0.00" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}><input className="inline-input" style={{ color: '#374151' }} value={item.estHrs} onChange={e => updateItem(i, 'estHrs', e.target.value)} placeholder="—" /></td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#9CA3AF', marginRight: '4px' }}>$</span>
                        <input className="inline-input" style={{ flex: 1, minWidth: 0, color: '#374151' }} value={item.low} onChange={e => updateItem(i, 'low', e.target.value)} placeholder="0.00" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#9CA3AF', marginRight: '4px' }}>$</span>
                        <input className="inline-input" style={{ flex: 1, minWidth: 0, color: '#374151' }} value={item.high} onChange={e => updateItem(i, 'high', e.target.value)} placeholder="0.00" />
                      </div>
                    </td>
                    <td className="no-print" style={{ padding: '12px 8px', verticalAlign: 'top', textAlign: 'center' }}>
                      <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '1rem', lineHeight: 1, padding: '2px 4px', borderRadius: '4px' }}>×</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>Subtotal</td>
                  <td style={{ padding: '12px 14px', color: '#9CA3AF', textAlign: 'left' }}>—</td>
                  <td style={{ padding: '12px 14px' }}><input className="inline-input" style={{ fontWeight: 700, color: '#111827' }} value={subHrs} onChange={e => setSubHrs(e.target.value)} placeholder="—" /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#9CA3AF', marginRight: '4px', fontWeight: 700 }}>$</span>
                      <input className="inline-input" style={{ flex: 1, minWidth: 0, fontWeight: 700, color: '#111827' }} value={subLow} onChange={e => setSubLow(e.target.value)} placeholder="0.00" />
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#9CA3AF', marginRight: '4px', fontWeight: 700 }}>$</span>
                      <input className="inline-input" style={{ flex: 1, minWidth: 0, fontWeight: 700, color: '#111827' }} value={subHigh} onChange={e => setSubHigh(e.target.value)} placeholder="0.00" />
                    </div>
                  </td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary no-print" onClick={addRow} style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', marginBottom: '32px' }}>+ Add Row</button>

          {/* BOTTOM BANNER */}
          <div className="pdf-no-break" style={{
            background: 'linear-gradient(135deg, #1a2d3d 0%, #213547 60%, #2a4460 100%)',
            borderRadius: '12px',
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '6px' }}>
                Recommended Quote Range
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Mid-point based on your finalized rates</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.8rem', fontWeight: 300 }}>$</span>
              <input className="inline-input" style={{ flex: 1, maxWidth: '240px', minWidth: 0, textAlign: 'right', fontSize: '1.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', padding: '4px 0', margin: 0, lineHeight: 1.2 }} value={recRange} onChange={e => setRecRange(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.6rem', marginTop: '28px', color: '#D1D5DB', letterSpacing: '0.05em' }}>
            Page 1 of 1 &nbsp;·&nbsp; Tri-Tech &nbsp;·&nbsp; tritechdevsolutions@gmail.com
          </div>
        </div>
      </div>

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} pdfUrl={previewUrl} title={`Quote — ${clientName || 'Draft'}`} />
    </div>
  );
}
