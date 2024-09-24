import React from 'react';

export default function CheckboxGroup({ label, options, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {options.map((option, idx) => (
        <div key={idx} className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            value={option.value}
            checked={option.checked}
            onChange={() => onChange(idx)}
          />
          <label className="form-check-label">{option.label}</label>
        </div>
      ))}
    </div>
  );
};
