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
  const [fromDetailsOpen, setFromDetailsOpen] = useState(false);
  const [toDetailsOpen, setToDetailsOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [showSavedClients, setShowSavedClients] = useState(false);

  // Keep required fields visible while letting finished sections collapse.
  const showFromDetails = fromDetailsOpen || !billFromDetails.trim();
  const showToDetails = toDetailsOpen || !billToDetails.trim();
  const showRecipientEmail =
    recipientOpen ||
    (recipientEmail.trim() && recipientEmail.trim() !== billToEmail.trim());

  const isEmailValid = (value) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const billToEmailValid = isEmailValid(billToEmail);
  const recipientEmailValid = isEmailValid(recipientEmail);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return savedClients;
    const query = clientSearch.toLowerCase();
    return savedClients.filter((client) => {
      const name = (client.billToName || "Unnamed Client").toLowerCase();
      const email = (client.billToEmail || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [clientSearch, savedClients]);

  const handleUseClientEmail = () => {
    if (!billToEmail.trim()) return;
    setRecipientEmail(billToEmail.trim());
    setRecipientOpen(true);
  };

  return (
    <div className="details-grid">
      <div className="details-panel">
        <p className="panel-eyebrow">Invoice Identity</p>
        <InputField
          label="Invoice #"
          value={invoiceNumber}
          setValue={setInvoiceNumber}
          placeholder="INV-0001"
          hint="Auto-generated for you. Adjust if your client needs a custom sequence."
        />
        <p className="muted small">
          This ID appears on the PDF, email subject, and payment history.
        </p>
      </div>

      <div className="details-panel">
        <div className="details-panel__heading">
          <div>
            <h3>Bill From</h3>
            <p className="muted">Your business details</p>
          </div>
          {billFromDetails.trim() && (
            <button
              type="button"
              className="btn btn-ghost btn-small details-toggle"
              onClick={() => setFromDetailsOpen((prev) => !prev)}
            >
              {showFromDetails ? "Hide details" : "Show details"}
            </button>
          )}
        </div>
        <InputField
          label="Business Name"
          value={billFromName}
          setValue={setBillFromName}
          hint="Required for export. Use the legal or trade name on file."
        />
        {showFromDetails ? (
          <InputField
            label="From Address / Notes"
            value={billFromDetails}
            setValue={setBillFromDetails}
            multiline
            rows={4}
            placeholder="Street, City, Contact info"
            hint="Required for export. Add address + preferred contact details."
            hintTone={!billFromDetails.trim() ? "error" : "muted"}
          />
        ) : (
          <div className="details-summary">
            <span className="muted small">On-file address</span>
            <p>{billFromDetails}</p>
          </div>
        )}
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
          <div>
            <h3>Bill To</h3>
            <p className="muted">Who you're invoicing</p>
          </div>
          {savedClients.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-small details-toggle"
              onClick={() => setShowSavedClients((prev) => !prev)}
            >
              {showSavedClients ? "Hide saved" : "Browse saved"}
            </button>
          )}
        </div>
        <div className="client-switcher">
          <div className="input-label-group">
            <label className="input-label" htmlFor="saved-client-select">
              Saved clients
            </label>
            <div className="client-switcher__actions">
              <button
                type="button"
                className="btn btn-ghost btn-small btn-add-client"
                onClick={onAddClient}
              >
                <span className="btn-add-icon">＋</span>
                <span>Add client</span>
              </button>
            </div>
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
          {savedClients.length > 0 && showSavedClients && (
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
                  <p className="muted small">
                    No matches yet. Try searching by name or email.
                  </p>
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
        <InputField
          label="Client Name"
          value={billToName}
          setValue={setBillToName}
          hint="Use the primary billing contact or company name."
        />
        <InputField
          label="Client Email"
          type="email"
          value={billToEmail}
          setValue={setBillToEmail}
          placeholder="client@email.com"
          hint={
            billToEmailValid
              ? "Used for receipts, reminders, and payment follow-ups."
              : "That email looks incomplete."
          }
          hintTone={billToEmailValid ? "muted" : "error"}
        />
        <div className="delivery-email">
          <div className="delivery-email__header">
            <span className="muted small">Delivery email</span>
            <div className="delivery-email__actions">
              {!showRecipientEmail && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => setRecipientOpen(true)}
                >
                  Add delivery email
                </button>
              )}
              {billToEmail.trim() && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={handleUseClientEmail}
                >
                  Use client email
                </button>
              )}
            </div>
          </div>
          {showRecipientEmail ? (
            <InputField
              label="Recipient Email"
              type="email"
              value={recipientEmail}
              setValue={setRecipientEmail}
              placeholder="Where should we send the invoice?"
              hint={
                recipientEmailValid
                  ? "Optional. Leave blank to send to the client email above."
                  : "Double-check the email format."
              }
              hintTone={recipientEmailValid ? "muted" : "error"}
            />
          ) : (
            <p className="muted small">
              We&apos;ll send to the client email unless you add a separate
              delivery address.
            </p>
          )}
        </div>
        {showToDetails ? (
          <>
            <InputField
              label="To Address / Details"
              value={billToDetails}
              setValue={setBillToDetails}
              multiline
              rows={4}
              placeholder="Street, City, Client notes"
              hint="Required for export. Add billing address or additional notes."
              hintTone={!billToDetails.trim() ? "error" : "muted"}
            />
            {billToDetails.trim() && (
              <button
                type="button"
                className="btn btn-ghost btn-small details-toggle"
                onClick={() => setToDetailsOpen(false)}
              >
                Hide billing details
              </button>
            )}
          </>
        ) : (
          <div className="details-summary">
            <span className="muted small">Billing details on file</span>
            <p>{billToDetails}</p>
            <button
              type="button"
              className="btn btn-ghost btn-small details-toggle"
              onClick={() => setToDetailsOpen(true)}
            >
              Edit billing details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
