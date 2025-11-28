import React from "react";

export default function InvoiceTable({
  items,
  updateItem,
  removeItem,
  addRow,
}) {
  return (
    <div className="table-wrap">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="cell-hours" style={{ width: 120 }}>
              Hours
            </th>
            <th className="cell-rate" style={{ width: 140 }}>
              Rate
            </th>
            <th className="cell-amount" style={{ width: 140 }}>
              Amount
            </th>
            <th style={{ width: 48 }}></th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="item-row">
              <td className="cell-description">
                <textarea
                  className="input control description-input"
                  value={item.description}
                  placeholder="Item description"
                  rows={2}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                />
              </td>

              <td className="cell-hours">
                <input
                  className="input control hours-input"
                  type="number"
                  min="0"
                  step="0.25"
                  value={item.hours}
                  onChange={(e) =>
                    updateItem(index, "hours", Number(e.target.value))
                  }
                />
              </td>

              <td className="cell-rate">
                <div className="currency-input">
                  <span aria-hidden="true">$</span>
                  <input
                    className="input control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(index, "price", Number(e.target.value))
                    }
                  />
                </div>
              </td>

              <td className="amount cell-amount">
                ${(Number(item.hours || 0) * Number(item.price || 0)).toFixed(2)}
              </td>

              <td>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove item ${index + 1}`}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-actions">
        <button className="btn btn-ghost" onClick={addRow}>
          + Add Item
        </button>
      </div>
    </div>
  );
}
