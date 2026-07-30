import { useEffect, useId, useRef } from "react";

export const MultiStateCheckbox = ({
  description,
  disabled = false,
  onChange,
  selectedLength,
  totalLength,
}: {
  description: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  selectedLength: number;
  totalLength: number;
}) => {
  const checkbox = useRef<HTMLInputElement>(null);
  const id = useId();

  const checked = selectedLength == totalLength;
  const indeterminate = selectedLength > 0 && !checked;

  useEffect(() => {
    if (checkbox.current) {
      checkbox.current.checked = checked;
      checkbox.current.indeterminate = indeterminate;
    }
  }, [checked, indeterminate]);

  return (
    <>
      <input
        className="size-4 rounded border-input"
        disabled={disabled}
        id={id}
        onChange={(e) => onChange(e.target.checked)}
        ref={checkbox}
        type="checkbox"
      />
      <label
        htmlFor={id}
        aria-description={`${checked ? "Deselect" : "Select"} ${description}`}
      ></label>
    </>
  );
};

export default MultiStateCheckbox;
