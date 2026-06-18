import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldContext } from "./context";
import {
  FormDescription,
  FormError,
  FormItem,
  FormLabel,
  RadioGroupOptions,
} from "./field-wrapper";

interface FieldWrapperProps {
  label?: string;
  description?: string;
  required?: boolean;
}

export function FieldInput({
  label,
  description,
  required,
  ...props
}: FieldWrapperProps &
  Omit<
    React.ComponentProps<typeof Input>,
    "id" | "value" | "onChange" | "onBlur"
  >) {
  const field = useFieldContext<string>();

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <Input
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export function FieldTextarea({
  label,
  description,
  required,
  ...props
}: FieldWrapperProps &
  Omit<
    React.ComponentProps<typeof Textarea>,
    "id" | "value" | "onChange" | "onBlur"
  >) {
  const field = useFieldContext<string>();

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <Textarea
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export function FieldDatePicker({
  label,
  description,
  required,
  placeholder = "YYYY-MM-DD",
}: FieldWrapperProps & { placeholder?: string }) {
  const field = useFieldContext<string>();

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <DatePickerInput
        id={field.name}
        placeholder={placeholder}
        value={field.state.value ?? ""}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
      />
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function FieldSelect({
  label,
  description,
  required,
  placeholder,
  options,
}: FieldWrapperProps & { placeholder?: string; options: SelectOption[] }) {
  const field = useFieldContext<string | number | null>();

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <Select
        value={
          field.state.value != null ? String(field.state.value) : undefined
        }
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger id={field.name} onBlur={field.handleBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export interface RadioOption<TValue> {
  value: TValue;
  label: string;
}

function radioKey(value: unknown) {
  return JSON.stringify(value);
}

export function FieldRadio<TValue>({
  label,
  description,
  required,
  options,
}: {
  label: string;
  description?: string;
  required?: boolean;
  options: RadioOption<TValue>[];
}) {
  const field = useFieldContext<TValue>();

  return (
    <FormItem>
      <Label className="font-extrabold">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <FormDescription>{description}</FormDescription>
      <RadioGroupOptions
        name={field.name}
        value={radioKey(field.state.value)}
        onValueChange={(key) => {
          const option = options.find((o) => radioKey(o.value) === key);
          if (option) field.handleChange(option.value);
        }}
        options={options.map((option) => ({
          value: radioKey(option.value),
          label: option.label,
        }))}
      />
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}
