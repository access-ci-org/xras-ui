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
  choices.forEach(([name, text], i) =>
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
      /*
       * A `.btn.btn-outline-primary` in a `.btn-group`, as the theme draws one:
       * the 4px border `custom.scss` gives every button, squared off, and
       * neighbours overlapping by a border width. The label opted out of the
       * theme's uppercase and sized its text at 0.75rem, and the check mark is
       * positioned rather than laid out, so that the text stays centred in the
       * button whether or not the choice is the selected one.
       *
       * The selected and disabled states come from the index rather than from
       * `peer-checked:`/`peer-disabled:`: those variants use the general
       * sibling combinator, so a checked radio would style every label after
       * it, not just its own.
       */
      <label
        className={cn(
          "relative block w-full cursor-pointer border-4 border-primary px-3 py-1.5",
          "text-center text-xs font-semibold leading-[18px] text-primary",
          i > 0 && "-ml-px",
          i < choices.length - 1 && "border-r-0",
          value === name && "bg-primary text-primary-foreground",
          disabledValues.includes(name) && "pointer-events-none opacity-65",
        )}
        key={`${name}-label`}
        htmlFor={name}
      >
        {value === name ? <Check className="absolute left-1 top-1.5 size-[18px]" /> : null}
        {text}
      </label>,
    ),
  );
  return (
    <div className="mb-2">
      {/* `--base-2` comes from `access.scss`, which is linked into the shadow
          root alongside the Tailwind sheet. */}
      <div className="flex w-96 bg-[var(--base-2)]" role="group" aria-label={label}>
        {radios}
      </div>
    </div>
  );
}
