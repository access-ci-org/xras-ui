export const SelectInput = ({ label, options, value, onChange }) => {
    return (
      <div>
        <label>{label}</label>
        <select className="form-control" value={value} onChange={onChange}>
          {options.map((option, idx) => (
            <option key={idx} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

    );
  };
  
  