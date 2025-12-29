import React, { useEffect, useMemo, useRef, useState } from "react";

export default function CommandPalette({ isOpen, onClose, actions }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredActions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((action) => {
      const haystack = [
        action.title,
        action.description,
        action.group,
        ...(action.keywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [actions, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex > filteredActions.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredActions.length]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) =>
        Math.min(prev + 1, filteredActions.length - 1)
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredActions[activeIndex];
      if (selected && !selected.disabled) {
        selected.onRun();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-overlay" onClick={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-input-row">
          <span className="command-icon" aria-hidden="true">
            Cmd
          </span>
          <input
            ref={inputRef}
            className="command-input"
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="command-close"
            onClick={onClose}
          >
            Esc
          </button>
        </div>
        <div className="command-results">
          {filteredActions.length === 0 ? (
            <p className="muted small command-empty">
              No matches yet. Try "send", "print", or "line item".
            </p>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={`${action.title}-${index}`}
                type="button"
                className={`command-item${
                  index === activeIndex ? " is-active" : ""
                }`}
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) return;
                  action.onRun();
                  onClose();
                }}
              >
                <div>
                  <span className="command-title">{action.title}</span>
                  {action.description && (
                    <span className="command-desc">{action.description}</span>
                  )}
                </div>
                {action.shortcut && (
                  <span className="command-shortcut">{action.shortcut}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
