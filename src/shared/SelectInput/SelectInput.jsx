import React from 'react';
import PropTypes from 'prop-types';

export const SelectInput = ({ label, options, value, onChange, ...props }) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select className="form-control" value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.additionalInfo && (
              <span> - {option.additionalInfo}</span>
            )}
          </option>
        ))}
      </select>
    </div>
  );
};

SelectInput.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      additionalInfo: PropTypes.string
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};