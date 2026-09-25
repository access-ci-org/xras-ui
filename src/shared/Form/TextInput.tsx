import { cn } from "@/lib/utils";

const inputClasses =
  "h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 focus-visible:outline-none focus-visible:border-ring-border focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type TextInputProps = {
  label?: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  disabled?: boolean;
  infoText?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  inputAddon?: React.ReactNode;
};

export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  infoText = "",
  style,
  inputClassName,
  inputAddon,
}: TextInputProps) {
  return (
    <>
      {label && <label>{label}</label>}
      {infoText && <small className="block text-muted-foreground">{infoText}</small>}
      {type === "textarea" ? (
        <textarea
          className={cn(inputClasses, "min-h-16", inputClassName)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={6}
        ></textarea>
      ) : inputAddon ? (
        <div className="flex items-stretch">
          <span className="inline-flex items-center border border-r-0 border-input bg-muted px-3 text-sm">
            {inputAddon}
          </span>
          <input
            type={type}
            className={cn(inputClasses, inputClassName)}
            style={style}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <input
          type={type}
          className={cn(inputClasses, inputClassName)}
          style={style}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </>
  );
}
