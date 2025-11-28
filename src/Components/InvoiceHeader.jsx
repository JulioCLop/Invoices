import React, { useMemo, useState } from "react";
import InputField from "./InputField";

export default function InvoiceHeader({
  invoiceNumber,
  setInvoiceNumber,
  billFromName,
  setBillFromName,
  billFromDetails,
  setBillFromDetails,
  persistBillFrom,
  setPersistBillFrom,
  billToName,
  setBillToName,
  billToEmail,
  setBillToEmail,
  recipientEmail,
  setRecipientEmail,
  billToDetails,
  setBillToDetails,
  savedClients,
  selectedClientKey,
  onSelectClient,
  onAddClient,
}) {
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return savedClients;
    const query = clientSearch.toLowerCase();
    return savedClients.filter((client) => {
      const name = (client.billToName || "Unnamed Client").toLowerCase();
      const email = (client.billToEmail || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [clientSearch, savedClients]);
  return (
    <div className="details-grid">
      <div className="details-panel">
        <p className="panel-eyebrow">Invoice Number</p>
        <InputField
          label="Invoice #"
          value={invoiceNumber}
          setValue={setInvoiceNumber}
          placeholder="INV-0001"
        />
      </div>

      <div className="details-panel">
        <div className="details-panel__heading">
          <h3>Bill From</h3>
          <p className="muted">Your business details</p>
        </div>
        <InputField
          label="Business Name"
          value={billFromName}
          setValue={setBillFromName}
        />
        <InputField
          label="From Address / Notes"
          value={billFromDetails}
          setValue={setBillFromDetails}
          multiline
          rows={4}
          placeholder="Street, City, Contact info"
        />
        <label className="persist-toggle">
          <input
            type="checkbox"
            checked={persistBillFrom}
            onChange={(e) => setPersistBillFrom(e.target.checked)}
          />
          Keep Bill From info for new invoices
        </label>
      </div>

      <div className="details-panel">
        <div className="details-panel__heading">
          <h3>Bill To</h3>
          <p className="muted">Who you're invoicing</p>
        </div>
        <div className="input-row">
          <div className="input-label-group">
            <label className="input-label" htmlFor="saved-client-select">
              Saved clients
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-small btn-add-client"
              onClick={onAddClient}
            >
              <span className="btn-add-icon">＋</span>
              <span>Add client</span>
            </button>
          </div>
          <select
            id="saved-client-select"
            className="input control"
            value={selectedClientKey}
            onChange={(e) => onSelectClient(e.target.value)}
          >
            <option value="">Custom client</option>
            {savedClients.map((client) => (
              <option key={client.key} value={client.key}>
                {client.billToName || "Unnamed Client"}
                {client.billToEmail ? ` · ${client.billToEmail}` : ""}
              </option>
            ))}
          </select>
          {savedClients.length > 0 && (
            <div className="saved-clients-panel">
              <div className="saved-clients-toolbar">
                <input
                  type="text"
                  className="input control saved-clients-search"
                  placeholder="Search saved clients"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <span className="saved-clients-count">
                  {filteredClients.length} saved
                </span>
              </div>
              <div className="saved-clients-scroll">
                {filteredClients.length === 0 ? (
                  <p className="muted small">No clients match that search.</p>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      type="button"
                      key={client.key}
                      className={`saved-client-card${
                        selectedClientKey === client.key
                          ? " saved-client-card--selected"
                          : ""
                      }`}
                      onClick={() => onSelectClient(client.key)}
                    >
                      <span className="saved-client-card__name">
                        {client.billToName || "Unnamed Client"}
                      </span>
                      {client.billToEmail && (
                        <span className="saved-client-card__email">
                          {client.billToEmail}
                        </span>
                      )}
                      {client.billToDetails && (
                        <span className="saved-client-card__details">
                          {client.billToDetails}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <InputField label="Client Name" value={billToName} setValue={setBillToName} />
        <InputField
          label="Client Email"
          type="email"
          value={billToEmail}
          setValue={setBillToEmail}
          placeholder="client@email.com"
        />
        <InputField
          label="Delivery Email (recipient)"
          type="email"
          value={recipientEmail}
          setValue={setRecipientEmail}
          placeholder="Where should we send the invoice?"
        />
        <InputField
          label="To Address / Details"
          value={billToDetails}
          setValue={setBillToDetails}
          multiline
          rows={4}
          placeholder="Street, City, Client notes"
        />
      </div>
    </div>
  );
}
