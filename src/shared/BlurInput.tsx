import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const noop = (value: string) => value;

export default function BlurInput({
  classes,
  clean = noop,
  format = noop,
  label,
  setValue,
  style,
  value,
}: {
  classes?: string;
  clean?: (value: string) => string;
  format?: (value: string) => string;
  label?: string;
  setValue: (value: string) => void;
  style?: React.CSSProperties;
  value: string;
}) {
  const formattedValue = format(value);
  const [text, setText] = useState(formattedValue);

  useEffect(() => {
    setText(formattedValue);
  }, [formattedValue]);

  return (
    <Input
      type="text"
      aria-label={label}
      className={cn(classes)}
      value={text}
      style={style}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => {
        const cleaned = clean(e.target.value);
        setText(format(cleaned));
        setValue(cleaned);
      }}
      onKeyDown={(e) => {
        if (e.code == "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
