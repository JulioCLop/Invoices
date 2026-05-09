import { useRef, useLayoutEffect } from "react";

// Textarea that grows to fit its content — never clips text on screen or in PDF
export default function AutoTextarea({ value, onChange, placeholder, style, className }) {
  const ref = useRef();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 4}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{
        resize: "none",
        overflow: "hidden",
        display: "block",
        width: "100%",
        lineHeight: 1.5,
        ...style,
      }}
    />
  );
}
