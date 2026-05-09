
export default function PreviewModal({ isOpen, onClose, pdfUrl, title }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'PDF Preview'}</h3>
          <button className="btn btn-secondary close-btn" onClick={onClose}>✖ Close</button>
        </div>
        <div className="modal-body">
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#view=FitH&navpanes=0`} 
              title="PDF Preview" 
              className="pdf-iframe"
            />
          ) : (
            <div className="loading-preview">Generating preview...</div>
          )}
        </div>
      </div>
    </div>
  );
}
