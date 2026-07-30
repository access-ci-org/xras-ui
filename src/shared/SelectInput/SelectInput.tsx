import { cn } from "@/lib/utils";

type SelectOption = {
  value: string | number;
  label: string;
  additionalInfo?: string;
  disabled?: boolean;
};

type SelectInputProps = {
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "className">;

export const SelectInput = ({
  label,
  options,
  value,
  onChange,
  className,
  ...props
}: SelectInputProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label>{label}</label>}
      <select
        className={cn(
          "h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        value={value}
        onChange={onChange}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
            {option.additionalInfo && ` - ${option.additionalInfo}`}
          </option>
        ))}
      </select>
    </div>
  );
};
