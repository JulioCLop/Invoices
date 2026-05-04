import React, { useState, useEffect, useRef } from "react";
import InvoiceHeader from "../components/InvoiceHeader";
import InvoiceTable from "../components/InvoiceTable";
import InvoiceTotals from "../components/InvoiceTotals";
import PreviewModal from "../components/PreviewModal";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";

export default function QuotePage() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("quote_items");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old defaults to new blank defaults
      if (parsed.length === 1 && parsed[0].description === "" && parsed[0].qty === 1 && parsed[0].price === 0) {
        return [{ description: "", qty: "", price: "" }];
      }
      return parsed;
    }
    return [{ description: "", qty: "", price: "" }];
  });

  const [businessName, setBusinessName] = useState(() => localStorage.getItem("quote_businessName") || "Tri-tech, LLC.");
  const [clientName, setClientName] = useState(() => localStorage.getItem("quote_clientName") || "");
  const [clientEmail, setClientEmail] = useState(() => localStorage.getItem("quote_clientEmail") || "");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const quoteRef = useRef();

  useEffect(() => {
    localStorage.setItem("quote_items", JSON.stringify(items));
    localStorage.setItem("quote_businessName", businessName);
    localStorage.setItem("quote_clientName", clientName);
    localStorage.setItem("quote_clientEmail", clientEmail);
  }, [items, businessName, clientName, clientEmail]);

  const addRow = () => {
    setItems([...items, { description: "", qty: "", price: "" }]);
  };

  const removeItem = (i) => {
    const updated = items.filter((_, index) => index !== i);
    setItems(updated);
  };

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);

  const generatePDF = () => {
    const element = quoteRef.current;
    
    // Add print class for clean capture
    element.classList.add("is-printing");

    const opt = {
      margin:       10,
      filename:     `Quote_${clientName || 'Draft'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Remove class after PDF is generated
      element.classList.remove("is-printing");
    });
  };

  const generatePreview = () => {
    setIsPreviewOpen(true);
    setPreviewUrl(null);
    const element = quoteRef.current;
    element.classList.add("is-printing");

    const opt = {
      margin:       10,
      filename:     `Quote_${clientName || 'Draft'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).output('bloburl').then((url) => {
      setPreviewUrl(url);
      element.classList.remove("is-printing");
    });
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="flex justify-between items-center mb-8 no-print">
        <div className="flex items-center gap-4">
          <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            ← Home
          </Link>
          <h1 style={{ marginBottom: 0, fontSize: '2rem' }}>Quote Generator</h1>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary" onClick={generatePreview}>
            Preview PDF
          </button>
          <button className="btn btn-primary" onClick={generatePDF}>
            Download PDF
          </button>
        </div>
      </div>

      <div ref={quoteRef} className="glass-panel" style={{ padding: '3rem', background: 'white' }}>
        
        <div className="flex justify-between items-start mb-8" style={{ borderBottom: '2px solid var(--border)', paddingBottom: '2rem' }}>
          <div>
            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>QUOTE</h2>
            <p style={{ color: 'var(--text-muted)' }}>Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {businessName && <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{businessName}</h3>}
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>tritechdevsolutions@gmail.com</p>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>720-984-4102</p>
          </div>
        </div>

        <InvoiceHeader
          businessName={businessName}
          setBusinessName={setBusinessName}
          clientName={clientName}
          setClientName={setClientName}
          clientEmail={clientEmail}
          setClientEmail={setClientEmail}
        />

        <InvoiceTable
          items={items}
          updateItem={updateItem}
          removeItem={removeItem}
          addRow={addRow}
        />

        <InvoiceTotals total={calculateTotal()} />
        
        <div style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          <p>This is a quote, not a bill. Pricing is valid for 30 days.</p>
        </div>
      </div>

      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        pdfUrl={previewUrl} 
        title={`Quote Preview - ${clientName || 'Draft'}`} 
      />
    </div>
  );
}
