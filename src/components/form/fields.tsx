import * as React from "react";
import ReactSelect from "react-select";
import { useStore, type AnyFieldApi } from "@tanstack/react-form";

import { Checkbox } from "@/components/ui/checkbox";
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
  ...props
}: FieldWrapperProps &
  Omit<
    React.ComponentProps<typeof Input>,
    "id" | "value" | "onChange"
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
      <Input
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={(e) => {
          field.handleBlur();
          onBlur?.(e);
        }}
        {...props}
      />
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
  disabled,
  placeholder = "YYYY-MM-DD",
}: FieldWrapperProps & { disabled?: boolean; placeholder?: string }) {
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
        disabled={disabled}
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
  disabled,
  placeholder,
  options,
}: FieldWrapperProps & {
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
}) {
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
        disabled={disabled}
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

export function FieldCheckbox({ label, description }: FieldWrapperProps) {
  const field = useFieldContext<boolean>();

  return (
    <FormItem>
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
        />
        {label ? (
          <Label htmlFor={field.name} className="font-normal">
            {label}
          </Label>
        ) : null}
      </div>
      <FormDescription>{description}</FormDescription>
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export interface ReactSelectOption {
  value: string;
  label: string;
}

type ReactSelectPassthroughProps = Omit<
  React.ComponentProps<typeof ReactSelect<ReactSelectOption, boolean>>,
  "inputId" | "options" | "value" | "onChange" | "onBlur" | "isMulti"
>;

export function FieldReactSelect({
  label,
  description,
  required,
  options,
  isMulti,
  ...props
}: FieldWrapperProps &
  ReactSelectPassthroughProps & {
    options: ReactSelectOption[];
    isMulti?: boolean;
  }) {
  const field = useFieldContext<string | string[]>();

  const value = isMulti
    ? options.filter((option) => (field.state.value as string[]).includes(option.value))
    : (options.find((option) => option.value === field.state.value) ?? null);

  return (
    <FormItem>
      {label ? (
        <FormLabel htmlFor={field.name} required={required}>
          {label}
        </FormLabel>
      ) : null}
      <FormDescription>{description}</FormDescription>
      <ReactSelect
        inputId={field.name}
        options={options}
        isMulti={isMulti}
        value={value}
        onChange={(selected) =>
          field.handleChange(
            isMulti
              ? (selected as readonly ReactSelectOption[]).map((option) => option.value)
              : ((selected as ReactSelectOption | null)?.value ?? ""),
          )
        }
        onBlur={field.handleBlur}
        {...props}
      />
      <FormError errors={field.state.meta.errors} />
    </FormItem>
  );
}

export function FieldRadio<TValue>({
  label,
  description,
  required,
  disabled,
  options,
}: {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
      />
      <FormError errors={errors} />
    </FormItem>
  );
}
