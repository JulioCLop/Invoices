import React from "react";

export default function InvoiceTable({ items, updateItem, removeItem, addRow }) {
  return (
    <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Description</th>
              <th style={{ width: '15%' }}>Qty</th>
              <th style={{ width: '20%' }}>Price</th>
              <th style={{ width: '10%' }}>Amount</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    className="input-field"
                    style={{ marginBottom: 0 }}
                    value={item.description}
                    placeholder="Item description"
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    className="input-field"
                    style={{ marginBottom: 0 }}
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(index, "qty", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    className="input-field"
                    style={{ marginBottom: 0 }}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </td>

                <td style={{ fontWeight: '500' }}>${((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)}</td>

                <td className="text-center">
                  <button
                    className="btn btn-danger no-print"
                    style={{ padding: '0.5rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => removeItem(index)}
                    title="Remove Item"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-secondary mt-2 no-print" onClick={addRow}>
        + Add Line Item
      </button>
    </div>
  );
}
