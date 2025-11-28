import React from "react";

export default function InputField({
  label,
  value,
  setValue,
  type = "text",
  placeholder = "",
  multiline = false,
  rows = 3,
}) {
  const InputTag = multiline ? "textarea" : "input";

  return (
    <div className="input-row">
      <label className="input-label">{label}</label>
      <InputTag
        className="input control"
        type={multiline ? undefined : type}
        placeholder={placeholder}
        value={value}
        rows={multiline ? rows : undefined}
        onChange={(e) => setValue(e.target.value)}
        aria-label={label}
      />
    </div>
  );
}
