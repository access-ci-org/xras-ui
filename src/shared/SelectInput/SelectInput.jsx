export const SelectInput = ({ label, options, value, onChange }) => {
    return (
      <div className="form-group">
        <label>{label}</label>
        <select className="form-control" value={value} onChange={onChange}>
          {options.map((option, idx) => (
            <option key={idx} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
  