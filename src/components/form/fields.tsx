import * as React from "react";
import { useStore, type AnyFieldApi } from "@tanstack/react-form";

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
  description?: React.ReactNode;
  required?: boolean;
}

// Validation runs continuously (onChange) so isValid is always accurate for
// consumers like the form-associated custom element wrapper, but errors
// should only be shown once a field has been touched or the form has had a
// submit attempt — otherwise every untouched required field would flash red
// on first render.
function useDisplayErrors(field: AnyFieldApi): unknown[] {
  const isSubmitted = useStore(field.form.store, (state) => state.isSubmitted);
  return field.state.meta.isTouched || isSubmitted ? field.state.meta.errors : [];
}

export function FieldInput({
  label,
  description,
  required,
  onBlur,
  transformValue,
  adornment,
  ...props
}: FieldWrapperProps &
  Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange"> & {
    /** Sanitizes each keystroke before it reaches form state, e.g. to
     * constrain a grant number to digits. */
    transformValue?: (raw: string) => string;
    /** Rendered on the right-hand side of the input itself, e.g. a lookup
     * spinner. Positioned against the input rather than the field, so a
     * description line above doesn't shift it. */
    adornment?: React.ReactNode;
  }) {
  const field = useFieldContext<string>();
  const errors = useDisplayErrors(field);

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <div className="relative">
        <Input
          id={field.name}
          value={field.state.value ?? ""}
          onChange={(e) =>
            field.handleChange(
              transformValue ? transformValue(e.target.value) : e.target.value,
            )
          }
          onBlur={(e) => {
            field.handleBlur();
            onBlur?.(e);
          }}
          {...props}
        />
        {adornment ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {adornment}
          </div>
        ) : null}
      </div>
      <FormError errors={errors} />
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
  const errors = useDisplayErrors(field);

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
      <FormError errors={errors} />
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
  const errors = useDisplayErrors(field);

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
      <FormError errors={errors} />
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
  const errors = useDisplayErrors(field);

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <Select
        value={field.state.value != null ? String(field.state.value) : ""}
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
      <FormError errors={errors} />
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
  const errors = useDisplayErrors(field);

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
          // Selecting an option is a complete interaction for a radio
          // group (there's no separate blur to wait for), so mark it
          // touched here for error-display purposes.
          field.handleBlur();
        }}
        options={options.map((option) => ({
          value: radioKey(option.value),
          label: option.label,
        }))}
      />
      <FormError errors={errors} />
    </FormItem>
  );
}
