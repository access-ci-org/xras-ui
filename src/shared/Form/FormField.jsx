import React from 'react';

export default function FormField({ label, type = 'text', value, onChange, disabled = false, infoText = '', style, inputClassName, inputAddon }) {
  return (
    <>
      {label && <label>{label}</label>}
      {/* Conditionally render info text */}
      {infoText && <small className={`form-text help-block`}>{infoText}</small>}
      {type === 'textarea' ? (
        <textarea
          className={`form-control ${inputClassName ? inputClassName : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows="6"
        ></textarea>
      ) : (
        /*
        Usage: Conditionally render the input with or without the `input-prepend` div
        Pass the text as a inputAddon prop from parent component
        */
         
        inputAddon ? (
          <div className="input-prepend">
            <span className="add-on">{inputAddon}</span>
            <input
              type={type}
              className={`form-control ${inputClassName ? inputClassName : ''}`}
              style={style}
              value={value}
              onChange={onChange}
              disabled={disabled}
            />
          </div>
        ) : (
          <input
            type={type}
            className={`form-control ${inputClassName ? inputClassName : ''}`}
            style={style}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      )}
    </>
  );
}
