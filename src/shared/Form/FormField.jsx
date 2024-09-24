import React from 'react';

export default function FormField({ label, type = 'text', value, onChange, disabled = false, className }) {
  return (
    <div className={`form-group ${className}`}>
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="form-control"
          value={value}
          onChange={onChange}
          disabled={disabled}
        ></textarea>
      ) : (
        <input
          type={type}
          className="form-control"
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
