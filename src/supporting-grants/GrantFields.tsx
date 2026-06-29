import { useState } from "react";
import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppForm } from "@/components/form";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import { fetchNSFGrantDetails, nsfDateToIso } from "./nsf-lookup";
import type { GrantFieldName, SupportingGrant } from "./types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatAsCurrency(value: string): string {
  const amount = Number(value.replace(/[^0-9.-]+/g, ""));
  if (!value || !Number.isFinite(amount)) return value;
  return currencyFormatter.format(amount);
}

interface GrantFieldsProps {
  form: AppForm<{ grants: SupportingGrant[] }>;
  index: number;
  onRemove: () => void;
}

export function GrantFields({ form, index, onRemove }: GrantFieldsProps) {
  const fundingAgencies = useAtomValue(fundingAgenciesAtom);
  const fosTypes = useAtomValue(fosTypesAtom);
  const [nsfLookupStatus, setNsfLookupStatus] = useState<
    "idle" | "pending" | "error"
  >("idle");

  async function handleGrantNumberBlur() {
    setNsfLookupStatus("idle");

    const grant = form.getFieldValue(`grants[${index}]`);
    const fundingAgency = fundingAgencies.find(
      (agency) => String(agency.id) === String(grant.fundingAgencyId),
    );
    if (fundingAgency?.abbr !== "NSF") return;

    const grantNumber = grant.grantNumber.replace(/[^0-9]+/g, "");
    if (!grantNumber) return;

    setNsfLookupStatus("pending");
    const details = await fetchNSFGrantDetails(grantNumber);
    if (!details) {
      setNsfLookupStatus("error");
      return;
    }
    setNsfLookupStatus("idle");

    const {
      title,
      pdPIName,
      startDate,
      expDate,
      fundsObligatedAmt,
      poName,
      poEmail,
    } = details;

    const setIfEmpty = (field: GrantFieldName, value: string | undefined) => {
      if (!value) return;
      const current = form.getFieldValue(`grants[${index}].${field}`);
      if (typeof current === "string" && current.length > 0) return;
      form.setFieldValue(`grants[${index}].${field}`, value);
    };

    setIfEmpty("title", title);
    setIfEmpty("piName", pdPIName);
    setIfEmpty("beginDate", startDate ? nsfDateToIso(startDate) : undefined);
    setIfEmpty("endDate", expDate ? nsfDateToIso(expDate) : undefined);
    setIfEmpty(
      "awardedAmount",
      fundsObligatedAmt ? formatAsCurrency(fundsObligatedAmt) : undefined,
    );
    setIfEmpty("programOfficerName", poName);
    setIfEmpty("programOfficerEmail", poEmail);

    // If grant information is available from the API, it has already been awarded.
    if (form.getFieldValue(`grants[${index}].isPending`) === null) {
      form.setFieldValue(`grants[${index}].isPending`, false);
    }
  }

  return (
    <div className="supporting-grant border border-input p-4 space-y-2">
      <div className="grid grid-cols-1 gap-4">
        <form.AppField name={`grants[${index}].fundingAgencyId`}>
          {(field) => (
            <field.FieldSelect
              label="Funding Agency"
              required
              placeholder="Select a funding agency"
              options={fundingAgencies.map((agency) => ({
                value: String(agency.id),
                label: agency.name,
              }))}
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].grantNumber`}>
          {(field) => (
            <div className="relative">
              <field.FieldInput
                label="Grant Number"
                required
                onBlur={() => void handleGrantNumberBlur()}
              />
              {nsfLookupStatus === "pending" ? (
                <Loader2 className="absolute right-2 top-8 size-4 animate-spin text-muted-foreground" />
              ) : null}
              {nsfLookupStatus === "error" ? (
                <p className="text-sm text-destructive">
                  Could not find an NSF grant with this number.
                </p>
              ) : null}
            </div>
          )}
        </form.AppField>

        <form.AppField name={`grants[${index}].title`}>
          {(field) => <field.FieldInput label="Grant Title" required />}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].piName`}>
          {(field) => <field.FieldInput label="PI Name" required />}
        </form.AppField>

        <form.AppField name={`grants[${index}].isPending`}>
          {(field) => (
            <field.FieldRadio
              required
              label="Is this grant pending?"
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          )}
        </form.AppField>
      </div>

      <form.Subscribe
        selector={(state) => state.values.grants[index]?.isPending === false}
      >
        {(requireAwardDetails) => (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.AppField name={`grants[${index}].beginDate`}>
                {(field) => (
                  <field.FieldDatePicker
                    label="Start Date"
                    required={requireAwardDetails}
                  />
                )}
              </form.AppField>

              <form.AppField name={`grants[${index}].endDate`}>
                {(field) => (
                  <field.FieldDatePicker
                    label="End Date"
                    required={requireAwardDetails}
                  />
                )}
              </form.AppField>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.AppField name={`grants[${index}].primaryFosTypeId`}>
                {(field) => (
                  <field.FieldSelect
                    label="Field of Science"
                    required
                    placeholder="-- Please select one --"
                    options={fosTypes.map((fos) => ({
                      value: String(fos.id),
                      label: fos.name,
                    }))}
                  />
                )}
              </form.AppField>

              <form.AppField name={`grants[${index}].awardedAmount`}>
                {(field) => (
                  <field.FieldInput
                    label="Awarded Amount"
                    required={requireAwardDetails}
                    placeholder="Enter awarded amount"
                    onBlur={(e) =>
                      field.handleChange(formatAsCurrency(e.target.value))
                    }
                  />
                )}
              </form.AppField>
              <form.Field name={`grants[${index}].awardedUnits`}>
                {(field) => (
                  <input
                    type="hidden"
                    value="Dollars"
                    onChange={() => field.handleChange("Dollars")}
                  />
                )}
              </form.Field>
            </div>
          </>
        )}
      </form.Subscribe>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].programOfficerName`}>
          {(field) => (
            <field.FieldInput
              label="Program Officer Name"
              required
              placeholder="Enter program officer name"
            />
          )}
        </form.AppField>

        <form.AppField name={`grants[${index}].programOfficerEmail`}>
          {(field) => (
            <field.FieldInput
              label="Program Officer Email"
              required
              placeholder="Enter valid email"
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name={`grants[${index}].comments`}>
        {(field) => (
          <field.FieldTextarea
            label="Explanation"
            description="Please explain how this supporting grant is related to your project. If the grant supports more than one ACCESS project, explain how your work is different from the existing projects."
            required
            rows={4}
            placeholder="Enter your explanation"
          />
        )}
      </form.AppField>

      <Button type="button" variant="destructive" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
