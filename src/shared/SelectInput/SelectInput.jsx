export const SelectInput = ({ label, options, value, onChange, style }) => {
    return (
      <>
        <label style={style}>{label}</label>
        <select className="form-control" style={style} value={value} onChange={onChange}>
          {options.map((option, idx) => (
            <option key={idx} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </>
    );
  };
  
  