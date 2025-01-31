import datepickerStyle from "./DatePicker.module.scss";

const DatePicker = ({
  value,
  onChange,
  disabled = false,
  style,
  className = "",
  minDate = "",
  maxDate = "",
  error = "",
}) => {
  const hasError = error;

  return (
    <div className={`w-full ${className}`}>
      <input
        type="date"
        style={style}
        className={`${datepickerStyle.datepicker} ${
          hasError ? datepickerStyle.error : ""
        }`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={minDate || "1900-01-01"}
        max={maxDate || "2100-12-31"}
      />
    </div>
  );
};

export default DatePicker;
