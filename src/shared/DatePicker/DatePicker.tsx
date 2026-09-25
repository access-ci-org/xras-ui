import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
};

const DatePicker = ({
  value,
  onChange,
  disabled = false,
  style,
  className = "",
  minDate = "",
  maxDate = "",
  error = "",
}: DatePickerProps) => {
  return (
    <div className={cn("w-full", className)}>
      <input
        type="date"
        style={style}
        className={cn(
          "h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 focus-visible:outline-none focus-visible:border-ring-border focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive bg-destructive/10 text-destructive",
        )}
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
