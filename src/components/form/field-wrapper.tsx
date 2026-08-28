import * as React from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function FormItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

export function FormLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </Label>
  );
}

export function FormDescription({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return String(error);
}

export function FormError({ errors }: { errors: unknown[] }) {
  if (!errors.length) return null;
  return (
    <p className="text-sm text-destructive">
      {errors.map(errorMessage).join(", ")}
    </p>
  );
}

export function RadioGroupOptions({
  name,
  value,
  onValueChange,
  options,
  className,
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={className}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
          <Label htmlFor={`${name}-${option.value}`} className="font-medium">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
