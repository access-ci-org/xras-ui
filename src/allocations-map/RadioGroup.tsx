import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RadioGroup({
  choices,
  disabledValues = [],
  label,
  value,
  setValue,
}: {
  choices: [string, string][];
  disabledValues?: string[];
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  const radios: React.ReactNode[] = [];
  choices.forEach(([name, text]) =>
    radios.push(
      <input
        type="radio"
        className="peer sr-only"
        key={name}
        name={name}
        id={name}
        autoComplete="off"
        checked={value === name}
        onChange={() => setValue(name)}
        disabled={disabledValues.includes(name)}
      />,
      <label
        className={cn(
          "relative w-full not-first:-ml-px",
          "flex items-center justify-center gap-1 border border-primary px-3 py-1.5 text-xs text-primary transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        )}
        key={`${name}-label`}
        htmlFor={name}
      >
        {value === name ? <Check className="size-3.5" /> : null} {text}
      </label>,
    ),
  );
  return (
    <div className="mb-2">
      <div className="flex w-96 bg-muted" role="group" aria-label={label}>
        {radios}
      </div>
    </div>
  );
}
