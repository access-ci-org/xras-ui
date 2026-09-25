import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRequest } from "./helpers/hooks";
import type { ResourceQuestion as ResourceQuestionType } from "./types";

export default function ResourceQuestion({
  question,
  requestId,
  grantNumber,
}: {
  question: ResourceQuestionType;
  requestId: number;
  grantNumber: string;
}) {
  const { request, setResourceQuestionValues } = useRequest(requestId, grantNumber);
  const id = useId();

  if (!question || !request || request.error) return null;

  const { attributeSetId, attributes, fieldType, label, resourceId, values } = question;
  const first = attributes[0];

  const singleChange = (value: string) =>
    setResourceQuestionValues(resourceId, attributeSetId, value ? [value] : []);

  const intChange = (value: string) => {
    const intValue = parseInt(value);
    setResourceQuestionValues(resourceId, attributeSetId, isNaN(intValue) ? [] : [intValue]);
  };

  const multiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceQuestionValues(
      resourceId,
      attributeSetId,
      Array.from(e.target.options)
        .filter(({ selected }) => selected)
        .map(({ value }) => parseInt(value, 10)),
    );
  };

  const checkChange = (attrId: number, checked: boolean) => {
    const newValues = checked ? [...values, attrId] : values.filter((value) => value != attrId);
    setResourceQuestionValues(resourceId, attributeSetId, newValues);
  };

  /* `.form-check-label`: the option text keeps the body's size and weight. */
  const checkLabel = "text-base font-normal leading-normal";

  let field;

  if (["calendar", "integer_only", "text"].includes(fieldType)) {
    const inputType = { calendar: "date", integer_only: "number", text: "text" }[fieldType];
    field = (
      <Input
        id={id}
        type={inputType}
        placeholder={first.label}
        required={first.required}
        value={values[0] || ""}
        onChange={(e) => (fieldType == "integer_only" ? intChange : singleChange)(e.target.value)}
      />
    );
  } else if (fieldType == "textarea") {
    field = (
      <Textarea
        id={id}
        placeholder={first.label}
        required={first.required}
        value={values[0] || ""}
        onChange={(e) => singleChange(e.target.value)}
      />
    );
  } else if (fieldType == "drop_down" || attributes.length >= 10) {
    const isMulti = fieldType == "multi_sel";
    if (isMulti) {
      field = (
        <select
          id={id}
          className="h-9 w-full rounded-none border border-input bg-transparent px-3 py-1"
          required={first.required}
          multiple
          onChange={multiChange}
          value={values.map(String)}
        >
          {attributes.map((attr) => (
            <option key={attr.resourceAttributeId} value={attr.resourceAttributeId}>
              {attr.label}
            </option>
          ))}
        </select>
      );
    } else {
      field = (
        <Select
          value={values[0] != null ? String(values[0]) : undefined}
          onValueChange={intChange}
        >
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {attributes.map((attr) => (
              <SelectItem key={attr.resourceAttributeId} value={String(attr.resourceAttributeId)}>
                {attr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
  } else if (fieldType == "single_sel") {
    field = (
      /* Bootstrap's `.form-check` rows: a 1.5rem-tall line with the input in
         its 1.5em indent, and 2px between rows. */
      <RadioGroup
        id={id}
        className="gap-0.5"
        value={values[0] != null ? String(values[0]) : undefined}
        onValueChange={(value) => intChange(value)}
      >
        {attributes.map((attr) => {
          const raId = `resource-attribute-${attr.resourceAttributeId}`;
          return (
            <div
              className="flex min-h-6 items-center gap-2"
              key={attr.resourceAttributeId}
            >
              <RadioGroupItem value={String(attr.resourceAttributeId)} id={raId} />
              <Label htmlFor={raId} className={checkLabel}>
                {attr.label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  } else {
    field = (
      <div id={id}>
        {attributes.map((attr) => {
          const raId = `resource-attribute-${attr.resourceAttributeId}`;
          return (
            <div
              className="mb-0.5 flex min-h-6 items-center gap-2"
              key={attr.resourceAttributeId}
            >
              <Checkbox
                id={raId}
                checked={values.includes(attr.resourceAttributeId)}
                onCheckedChange={(checked) => checkChange(attr.resourceAttributeId, checked === true)}
              />
              <Label htmlFor={raId} className={checkLabel}>
                {attr.label}
              </Label>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* `.form-label`, which the ACCESS theme renders a size down from the
          body, in bold, and a little tighter to its field. */}
      <Label htmlFor={id} className="mb-[0.3rem] block text-sm font-bold leading-normal">
        {label}
        {first.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {field}
    </div>
  );
}
