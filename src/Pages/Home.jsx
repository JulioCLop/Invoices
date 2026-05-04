import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel text-center" style={{ maxWidth: '600px', width: '100%' }}>
        
        <div style={{ background: 'var(--primary)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', fontSize: '2rem', boxShadow: 'var(--shadow-md)' }}>
          📄
        </div>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Tri-tech, LLC. Billing & Quotes</h1>
        
        <p className="mb-8" style={{ fontSize: '1.1rem' }}>
          Create beautiful, premium invoices and quotes in seconds. Export them directly to PDF without any hassle. Elevate your business experience.
        </p>
        
        <div className="flex gap-4" style={{ justifyContent: 'center' }}>
          <Link to="/invoice" className="btn btn-primary" style={{ padding: '1rem 1.5rem', fontSize: '1.1rem' }}>
            Create New Invoice
          </Link>
          <Link to="/quote" className="btn btn-secondary" style={{ padding: '1rem 1.5rem', fontSize: '1.1rem' }}>
            Create New Quote
          </Link>
        </div>

      </div>
    </div>
  );
}
