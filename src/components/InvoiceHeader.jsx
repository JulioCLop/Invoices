import React from "react";
import InputField from "./InputField";

export default function InvoiceHeader({
  businessName,
  setBusinessName,
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
}) {
  return (
    <div className="flex justify-between gap-4 w-full mb-8" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <div className="no-print" style={{ flex: '1 1 300px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>From:</h3>
        <InputField label="Your Business Name" value={businessName} setValue={setBusinessName} />
      </div>
      <div style={{ flex: '1 1 300px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>To:</h3>
        <InputField label="Client Name" value={clientName} setValue={setClientName} />
        <InputField label="Client Email" type="email" value={clientEmail} setValue={setClientEmail} />
      </div>
    </div>
  );
}
