import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import style from "./RadioGroup.module.scss";

export default function RadioGroup({
  choices,
  disabledValues = [],
  label,
  value,
  setValue,
}) {
  const radios = [];
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
          "flex items-center justify-center gap-1 border border-primary px-3 py-1.5 text-xs text-primary transition-colors not-first:-ml-px peer-checked:bg-primary peer-checked:text-primary-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          style.button,
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
      <div
        className={cn("flex", style.group)}
        role="group"
        aria-label={label}
      >
        {radios}
      </div>
    </div>
  );
}
