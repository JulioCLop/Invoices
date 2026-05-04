import React from "react";

export default function InputField({ label, value, setValue, type = "text" }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input-field"
      />
    </div>
  );
}
