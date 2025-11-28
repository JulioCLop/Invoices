import React from "react";

export default function InvoiceTotals({
  subtotal,
  taxRate,
  setTaxRate,
  taxAmount,
  total,
}) {
  const handleTaxChange = (value) => {
    const next = value === "" ? "" : Math.max(0, Number(value));
    setTaxRate(next);
  };

  return (
    <div className="totals">
      <div className="totals-row">
        <div>Subtotal</div>
        <div>${subtotal.toFixed(2)}</div>
      </div>

      <div className="tax-row">
        <div>
          <label htmlFor="taxRate" className="input-label">
            Tax Rate
          </label>
          <p className="muted small">Applied to subtotal</p>
        </div>

        <div className="tax-row__values">
          <div className="tax-input">
            <input
              id="taxRate"
              className="input control"
              type="number"
              min="0"
              step="0.1"
              value={taxRate}
              onChange={(e) => handleTaxChange(e.target.value)}
            />
            <span>%</span>
          </div>
          <div className="tax-amount">${taxAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="totals-row totals-row--total">
        <div>Grand Total</div>
        <div>
          <strong>${total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}
