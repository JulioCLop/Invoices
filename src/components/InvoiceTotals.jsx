import React from "react";

export default function InvoiceTotals({ total }) {
  return (
    <div className="flex justify-between items-center mb-8" style={{ justifyContent: 'flex-end' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '300px' }}>
        <div className="flex justify-between items-center" style={{ fontSize: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total:</span>
          <strong style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}
